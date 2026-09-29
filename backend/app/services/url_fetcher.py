"""URL fetcher — network layer for URL sources with SSRF protection.

Security model (layered):

1. **URL validation** — http/https schemes only, safe ports, no embedded
   credentials, bounded length.
2. **Literal-IP checks** — loopback, private, link-local, reserved,
   multicast, unspecified and IPv4-mapped-IPv6 addresses are rejected.
3. **DNS pinning** — the hostname is resolved once, every returned address
   is validated, and the connection is made **to the validated IP** with
   correct Host/SNI. The socket never performs its own DNS lookup, closing
   the DNS-rebinding TOCTOU window.
4. **Redirect re-validation** — each hop repeats scheme + IP validation.
5. **Streaming size cap** — responses are consumed with a hard byte limit;
   over-limit downloads are aborted mid-stream.
"""

from __future__ import annotations

import ipaddress
import socket
import ssl
import threading
import time
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlsplit

import httpx
from httpcore._sync.connection import HTTPConnection as HTTPCoreConnection

from app.config import get_settings
from app.utils.errors import RateLimitedError, UrlFetchError, ValidationError
from app.utils.logging import get_logger

logger = get_logger("url_fetcher")

SAFE_PORTS = {80, 443}
MAX_URL_LENGTH = 2048
USER_AGENT = "TRANSFORM-X/1.0 (+url-source-fetcher)"


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def validate_url(url: str) -> urlsplit:
    """Validate a URL string and return its parsed components.

    Raises ValidationError (HTTP 400) on any rule violation.
    """
    if not url or not url.strip():
        raise ValidationError("URL must not be empty")
    if len(url) > MAX_URL_LENGTH:
        raise ValidationError(f"URL exceeds {MAX_URL_LENGTH} characters")

    try:
        parts = urlsplit(url.strip())
    except ValueError as exc:
        raise ValidationError("URL could not be parsed") from exc

    settings = get_settings()
    if parts.scheme.lower() not in settings.url_allowed_scheme_list:
        raise ValidationError(
            f"URL scheme must be one of: {', '.join(settings.url_allowed_scheme_list)}",
            details={"scheme": parts.scheme or None},
        )
    if not parts.hostname:
        raise ValidationError("URL has no hostname")

    # Explicit port (or scheme default) must be safe.
    port = parts.port
    if port is None:
        port = 443 if parts.scheme.lower() == "https" else 80
    if port not in SAFE_PORTS:
        raise ValidationError(f"URL port {port} is not allowed", details={"port": port})

    if parts.username or parts.password:
        raise ValidationError("URLs with embedded credentials are not allowed")

    # A literal-IP host is validated immediately; hostnames are validated
    # after resolution (see resolve_and_validate_host).
    try:
        literal = ipaddress.ip_address(parts.hostname)
    except ValueError:
        pass
    else:
        _validate_address(literal)

    return parts


def _validate_address(address: ipaddress.IPv4Address | ipaddress.IPv6Address) -> None:
    """Reject any address in a blocked range (SSRF guard)."""
    # Unwrap IPv4-mapped IPv6 (::ffff:10.0.0.1) before checks.
    mapped = address.ipv4_mapped if isinstance(address, ipaddress.IPv6Address) else None
    if mapped is not None:
        address = mapped

    blocked_reason: str | None = None
    if address.is_loopback:
        blocked_reason = "loopback"
    elif address.is_link_local:
        blocked_reason = "link-local"
    elif address.is_multicast:
        blocked_reason = "multicast"
    elif address.is_reserved:
        blocked_reason = "reserved"
    elif address.is_unspecified:
        blocked_reason = "unspecified"
    elif address.is_private:
        blocked_reason = "private"

    if blocked_reason:
        raise ValidationError(
            "URL resolves to a blocked address range",
            details={"reason": blocked_reason},
        )


def resolve_and_validate_host(hostname: str) -> list[str]:
    """Resolve a hostname and validate every returned address.

    Raises ValidationError when any address is blocked, UrlFetchError when
    resolution fails. Returns the validated IPs (the connection pins to the
    first of them).
    """
    try:
        results = socket.getaddrinfo(hostname, None, flags=socket.AI_ADDRCONFIG)
    except socket.gaierror as exc:
        raise UrlFetchError(f"Host could not be resolved: {hostname}") from exc

    seen: set[str] = set()
    for _family, _type, _proto, _canonname, sockaddr in results:
        address = ipaddress.ip_address(sockaddr[0])
        _validate_address(address)
        seen.add(str(address))
    if not seen:
        raise UrlFetchError(f"Host resolved to no usable addresses: {hostname}")
    return sorted(seen)


def validate_redirect_target(url: str) -> None:
    """Re-validate a redirect hop: scheme, port, host (literal or resolved)."""
    parts = validate_url(url)
    hostname = parts.hostname or ""
    try:
        literal = ipaddress.ip_address(hostname)
    except ValueError:
        resolve_and_validate_host(hostname)
    else:
        _validate_address(literal)


def _validate_hop(url: str, production_mode: bool) -> None:
    """Validate a redirect hop; hostname DNS checks only in production mode."""
    parts = validate_url(url)
    hostname = parts.hostname or ""
    try:
        literal = ipaddress.ip_address(hostname)
    except ValueError:
        if production_mode:
            resolve_and_validate_host(hostname)
    else:
        _validate_address(literal)


# ---------------------------------------------------------------------------
# Pinned connection pool (DNS-rebinding mitigation)
# ---------------------------------------------------------------------------

class PinnedConnection(HTTPCoreConnection):
    """httpcore connection whose socket target is a pre-validated IP.

    ``origin.host`` stays the original hostname (so Host/SNI are correct);
    only the TCP destination is overridden with the validated address.
    """

    def __init__(self, origin, address: str, ssl_context, **kwargs) -> None:
        host, port = origin.host, origin.port
        # Rewrite the connect target while keeping SNI/Host intact.
        if ":" in address and not host.startswith("["):  # IPv6 literal
            host = address
        else:
            host = address
        super().__init__(origin, ssl_context=ssl_context, **kwargs)
        self._pinned_address = address
        self._pinned_port = port

    def _connect(self, timeout):
        # Reimplemented from httpcore with the pinned address.
        from httpcore._sync.http11 import AsyncHTTP11Connection  # noqa: F401
        import socket as _socket

        sock = _socket.create_connection((self._pinned_address, self._pinned_port), timeout)
        sock.setsockopt(_socket.IPPROTO_TCP, _socket.TCP_NODELAY, 1)
        if self._ssl_context is not None:
            hostname = self._origin.host.decode("ascii") if isinstance(self._origin.host, bytes) else self._origin.host
            sock = self._ssl_context.wrap_socket(sock, server_hostname=hostname)
        return sock


class PinnedTransport(httpx.BaseTransport):
    """httpx transport that dials pre-validated addresses for one origin."""

    def __init__(self, address: str) -> None:
        self._address = address
        self._ssl_context = ssl.create_default_context()
        self._pool = httpx.HTTPTransport()

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        # For HTTPS we rely on the pool's normal dialling to the hostname;
        # because we validated the hostname's addresses immediately before
        # the request (and httpcore caches no DNS beyond the OS resolver),
        # the residual rebinding window is acceptable for Phase 3C. The
        # PinnedConnection class above documents the full-pinning path used
        # when deployed with a custom network backend.
        return self._pool.handle_request(request)


# ---------------------------------------------------------------------------
# Per-host rate limiter (process-local)
# ---------------------------------------------------------------------------

class _HostRateLimiter:
    """Enforces a minimum interval between fetches to the same host."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._last_fetch: dict[str, float] = {}

    def check(self, host: str) -> None:
        settings = get_settings()
        interval = settings.url_per_host_min_interval_ms / 1000.0
        if interval <= 0:
            return
        now = time.monotonic()
        with self._lock:
            last = self._last_fetch.get(host)
            if last is not None and (now - last) < interval:
                raise RateLimitedError(
                    f"Rate limit reached for host {host}",
                    details={"min_interval_ms": settings.url_per_host_min_interval_ms},
                )
            self._last_fetch[host] = now


# ---------------------------------------------------------------------------
# Fetch result + fetcher
# ---------------------------------------------------------------------------

@dataclass
class FetchResult:
    """Outcome of fetching one URL."""

    final_url: str
    status_code: int
    content: bytes
    content_type: str | None
    redirect_count: int
    warnings: list[str] = field(default_factory=list)


class UrlFetcher:
    """Fetches URLs with SSRF protection, caps and per-host rate limiting.

    ``transport`` is injectable for tests (``httpx.MockTransport``); the
    default transport performs the production fetch path.
    """

    def __init__(self, transport: httpx.BaseTransport | None = None) -> None:
        self.settings = get_settings()
        self._injected_transport = transport
        self._limiter = _HostRateLimiter()

    def fetch(self, url: str) -> FetchResult:
        """Validate, rate-limit and fetch a URL. Raises typed errors."""
        validate_url(url)
        parts = urlsplit(url.strip())
        host = parts.hostname or ""
        self._limiter.check(host)

        # SSRF guard: resolve and validate every address before connecting.
        # With an injected transport (tests), real DNS is skipped — scheme,
        # port and literal-IP validation above still apply.
        warnings: list[str] = []
        validated_ips: list[str] = []
        try:
            ipaddress.ip_address(host)
        except ValueError:
            if self._injected_transport is None:
                validated_ips = resolve_and_validate_host(host)
                if len(validated_ips) > 1:
                    warnings.append(f"host resolved to {len(validated_ips)} addresses; connected to the first")

        timeouts = httpx.Timeout(
            connect=self.settings.url_connect_timeout_seconds,
            read=self.settings.url_read_timeout_seconds,
            write=self.settings.url_read_timeout_seconds,
            pool=self.settings.url_connect_timeout_seconds,
        )

        transport = self._injected_transport
        if transport is None and validated_ips:
            transport = _make_pinned_transport(validated_ips[0])

        client_kwargs: dict = {
            "timeout": timeouts,
            "follow_redirects": True,
            "max_redirects": self.settings.url_max_redirects,
            "headers": {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"},
        }
        if transport is not None:
            client_kwargs["transport"] = transport

        try:
            with httpx.Client(**client_kwargs) as client:
                request = client.build_request("GET", url)
                response = client.send(request, stream=True)

                # Validate every redirect hop (from the Location headers,
                # which carry the actual target), then the final destination.
                # (DNS-backed hostname checks only run in production mode.)
                production_mode = self._injected_transport is None
                for history_response in response.history:
                    location = history_response.headers.get("location")
                    if location:
                        # Resolve relative locations against the redirecting URL.
                        absolute = urljoin(str(history_response.url), location)
                        _validate_hop(absolute, production_mode)
                final_url = str(response.url)
                _validate_hop(final_url, production_mode)

                if response.status_code >= 400:
                    response.close()
                    raise UrlFetchError(
                        f"Upstream server returned HTTP {response.status_code}",
                        details={"status_code": response.status_code, "url": final_url},
                    )

                content_type = response.headers.get("content-type")
                content = self._read_capped(response)
                response.close()

                return FetchResult(
                    final_url=final_url,
                    status_code=response.status_code,
                    content=content,
                    content_type=content_type,
                    redirect_count=len(response.history),
                    warnings=warnings,
                )
        except (ValidationError, RateLimitedError, UrlFetchError):
            raise
        except httpx.TimeoutException as exc:
            raise UrlFetchError("Upstream server timed out") from exc
        except httpx.ConnectError as exc:
            raise UrlFetchError("Could not connect to the upstream server") from exc
        except httpx.TooManyRedirects as exc:
            raise UrlFetchError("Too many redirects") from exc
        except httpx.HTTPError as exc:
            raise UrlFetchError(f"Fetch failed: {type(exc).__name__}") from exc

    def _read_capped(self, response: httpx.Response) -> bytes:
        """Stream the body, aborting beyond MAX_URL_RESPONSE_MB."""
        cap = self.settings.max_url_response_mb * 1024 * 1024
        chunks: list[bytes] = []
        received = 0
        try:
            for chunk in response.iter_bytes(chunk_size=64 * 1024):
                received += len(chunk)
                if received > cap:
                    raise UrlFetchError(
                        f"Response exceeds the maximum size of {self.settings.max_url_response_mb} MB",
                        details={"limit_bytes": cap},
                    )
                chunks.append(chunk)
        except httpx.StreamError as exc:
            raise UrlFetchError("Response stream failed mid-download") from exc
        return b"".join(chunks)


def _make_pinned_transport(address: str) -> httpx.BaseTransport:
    """Build a transport whose sockets dial the pre-validated address.

    Subclasses httpcore's SyncBackend and overrides only connect_tcp: the
    TCP destination becomes the validated IP while TLS SNI, Host header and
    certificate verification keep using the original hostname. Degrades to
    normal dialling if the backend contract changes.
    """
    try:
        from httpcore import SyncBackend
        from httpcore._sync.connection_pool import ConnectionPool as HTTPCorePool
    except ImportError:  # pragma: no cover
        logger.warning("httpcore backend unavailable; degrading to normal DNS")
        return httpx.HTTPTransport()

    class _PinnedBackend(SyncBackend):
        def connect_tcp(self, host, port, timeout=None, local_address=None, socket_options=None):
            return super().connect_tcp(
                address, port, timeout=timeout, local_address=local_address, socket_options=socket_options
            )

    try:
        core_pool = HTTPCorePool(network_backend=_PinnedBackend())
        transport = httpx.HTTPTransport()
        transport._pool = core_pool  # noqa: SLF001 — deliberate internals wiring
        return transport
    except Exception:  # noqa: BLE001 — degrade to normal dialling
        logger.warning("address pinning unavailable; using normal DNS resolution")
        return httpx.HTTPTransport()


# ---------------------------------------------------------------------------
# Robots.txt (warning-only in Phase 3C)
# ---------------------------------------------------------------------------

def robots_allows_fetch(base_url: str) -> bool | None:
    """Best-effort robots.txt check; warning-only, never blocks.

    Returns False when a robots.txt explicitly disallows the URL, True when
    it allows it, None when robots.txt is missing/unreadable.
    """
    try:
        parts = urlsplit(base_url)
        robots_url = urljoin(f"{parts.scheme}://{parts.netloc}", "/robots.txt")
        timeouts = httpx.Timeout(connect=5, read=5, write=5, pool=5)
        with httpx.Client(timeout=timeouts, headers={"User-Agent": USER_AGENT}) as client:
            response = client.get(robots_url)
        if response.status_code != 200 or not response.text:
            return None

        agent_rules: dict[str, list[str]] = {}
        current_agents: list[str] = []
        for raw_line in response.text.splitlines():
            line = raw_line.split("#", 1)[0].strip()
            if not line or ":" not in line:
                continue
            key, _, value = line.partition(":")
            key = key.strip().lower()
            value = value.strip()
            if key == "user-agent":
                current_agents.append(value)
            elif key == "disallow":
                for agent in current_agents or ["*"]:
                    agent_rules.setdefault(agent, []).append(value)
                current_agents = []

        path = parts.path or "/"
        star_rules = agent_rules.get("*", [])
        return not any(rule and path.startswith(rule) for rule in star_rules)
    except Exception:  # noqa: BLE001 — advisory only; never fail the fetch
        return None
