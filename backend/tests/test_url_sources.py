"""Tests for Phase 3C — URL fetching, SSRF protection and HTML extraction.

All network access is mocked with ``httpx.MockTransport`` — no test touches
a real socket, and loopback blocking never interferes with testing.
"""

import ipaddress
from urllib.parse import urlsplit

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.services import url_fetcher as uf
from app.services.source_service import SourceService
from app.services.url_fetcher import UrlFetcher, validate_url
from app.utils.errors import RateLimitedError, UrlFetchError, ValidationError


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

HTML_PAGE = """<!DOCTYPE html>
<html><head>
<title>Quarterly Security Report</title>
<meta name="description" content="Summary of quarterly security posture.">
<style>body {{ color: red }}</style>
<script>console.log("evil")</script>
</head><body>
<nav>Menu Home About</nav>
<h1>Quarterly Security Report</h1>
<p>The security posture improved during the quarter.</p>
<p>Phishing attempts declined by twelve percent.</p>
<footer>Copyright Footer</footer>
</body></html>"""


def make_transport(handler) -> httpx.MockTransport:
    return httpx.MockTransport(handler)


def fetcher_with(handler) -> UrlFetcher:
    """A UrlFetcher whose per-host limiter and settings are test-friendly."""
    settings = get_settings()
    original_interval = settings.url_per_host_min_interval_ms
    settings.url_per_host_min_interval_ms = 0  # disable rate limiting per test
    f = UrlFetcher(transport=make_transport(handler))
    settings.url_per_host_min_interval_ms = original_interval
    return f


# ---------------------------------------------------------------------------
# Validation tests
# ---------------------------------------------------------------------------

class TestUrlValidation:
    def test_valid_https_url(self) -> None:
        parts = validate_url("https://example.com/article")
        assert parts.hostname == "example.com"

    def test_http_allowed(self) -> None:
        assert validate_url("http://example.com/").scheme == "http"

    def test_file_scheme_rejected(self) -> None:
        with pytest.raises(ValidationError):
            validate_url("file:///etc/passwd")

    def test_data_scheme_rejected(self) -> None:
        with pytest.raises(ValidationError):
            validate_url("data:text/html,hello")

    def test_ftp_scheme_rejected(self) -> None:
        with pytest.raises(ValidationError):
            validate_url("ftp://example.com/file")

    def test_port_8080_rejected(self) -> None:
        with pytest.raises(ValidationError):
            validate_url("http://example.com:8080/")

    def test_embedded_credentials_rejected(self) -> None:
        with pytest.raises(ValidationError):
            validate_url("http://user:pass@example.com/")

    def test_too_long_url_rejected(self) -> None:
        with pytest.raises(ValidationError):
            validate_url("https://example.com/" + "a" * 3000)

    def test_empty_url_rejected(self) -> None:
        with pytest.raises(ValidationError):
            validate_url("   ")


class TestSsrfGuards:
    @pytest.mark.parametrize(
        "url",
        [
            "http://127.0.0.1/x",
            "http://[::1]/x",
            "http://10.1.2.3/x",
            "http://172.16.0.9/x",
            "http://192.168.1.50/x",
            "http://169.254.169.254/latest/meta-data",  # cloud metadata
            "http://0.0.0.0/x",
        ],
    )
    def test_literal_private_ips_rejected(self, url: str) -> None:
        with pytest.raises(ValidationError):
            validate_url(url)

    def test_ipv4_mapped_ipv6_rejected(self) -> None:
        with pytest.raises(ValidationError):
            validate_url("http://[::ffff:10.0.0.1]/x")

    def test_hostname_resolving_to_private_ip_blocked(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(
            uf.socket, "getaddrinfo", lambda *a, **k: [(2, 1, 6, "", ("192.168.0.10", 0))]
        )
        with pytest.raises(ValidationError):
            uf.resolve_and_validate_host("internal.example.com")

    def test_hostname_resolving_to_public_ip_allowed(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(
            uf.socket, "getaddrinfo", lambda *a, **k: [(2, 1, 6, "", ("93.184.216.34", 0))]
        )
        assert uf.resolve_and_validate_host("example.com") == ["93.184.216.34"]

    def test_dns_failure_raises_fetch_error(self, monkeypatch: pytest.MonkeyPatch) -> None:
        import socket

        def raise_gaierror(*a, **k):
            raise socket.gaierror()

        monkeypatch.setattr(uf.socket, "getaddrinfo", raise_gaierror)
        with pytest.raises(UrlFetchError):
            uf.resolve_and_validate_host("nonexistent.example")

    def test_redirect_to_private_ip_blocked(self, monkeypatch: pytest.MonkeyPatch) -> None:
        import socket

        monkeypatch.setattr(
            uf.socket, "getaddrinfo", lambda *a, **k: [(2, 1, 6, "", ("93.184.216.34", 0))]
        )

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/redirect":
                return httpx.Response(302, headers={"Location": "http://169.254.169.254/meta"})
            return httpx.Response(200, text="ok")

        fetcher = fetcher_with(handler)
        with pytest.raises(ValidationError):
            fetcher.fetch("http://public.example.com/redirect")


# ---------------------------------------------------------------------------
# Fetch + extraction tests (mocked network)
# ---------------------------------------------------------------------------

class TestFetchAndExtract:
    def _create_url_source(self, client: TestClient, handler, url: str = "http://public.example.com/article", **json_extra) -> dict:
        settings = get_settings()
        original = settings.url_per_host_min_interval_ms
        settings.url_per_host_min_interval_ms = 0
        try:
            source_service_url_handler = handler
            # Patch UrlFetcher used inside the service through the API by
            # monkeypatching at the module import site.
            import app.services.source_service as ss

            original_fetcher = ss.UrlFetcher
            ss.UrlFetcher = lambda: UrlFetcher(transport=make_transport(handler))
            try:
                payload = {"url": url, **json_extra}
                response = client.post("/api/v1/sources/url", json=payload)
            finally:
                ss.UrlFetcher = original_fetcher
        finally:
            settings.url_per_host_min_interval_ms = original
        assert response.status_code == 201, response.text
        return response.json()["data"]

    def test_fetch_and_extract_article(self, client: TestClient) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, text=HTML_PAGE, headers={"Content-Type": "text/html; charset=utf-8"})

        data = self._create_url_source(client, handler)
        assert data["source_type"] == "URL"
        assert data["title"] == "Quarterly Security Report"
        assert "security posture improved" in data["text_content"]
        assert data["text_content"]  # non-empty
        meta = data["processor_metadata"]
        assert meta["extraction_engine"] == "httpx+beautifulsoup"
        assert meta["http_status"] == "200"
        assert meta["final_url"].startswith("http://public.example.com")
        assert meta["html_title"] == "Quarterly Security Report"

    def test_scripts_and_styles_excluded(self, client: TestClient) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, text=HTML_PAGE, headers={"Content-Type": "text/html"})

        data = self._create_url_source(client, handler)
        text = data["text_content"]
        assert "evil" not in text          # script content
        assert "color: red" not in text    # style content
        assert "Copyright Footer" not in text
        assert "Menu Home About" not in text

    def test_redirect_followed_and_counted(self, client: TestClient) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/old":
                return httpx.Response(301, headers={"Location": "/new"})
            return httpx.Response(200, text=HTML_PAGE, headers={"Content-Type": "text/html"})

        data = self._create_url_source(client, handler, url="http://public.example.com/old")
        assert data["processor_metadata"]["redirect_count"] == "1"

    def test_http_404_maps_to_502(self, client: TestClient) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(404, text="not found")

        settings = get_settings()
        settings.url_per_host_min_interval_ms = 0
        import app.services.source_service as ss

        original = ss.UrlFetcher
        ss.UrlFetcher = lambda: UrlFetcher(transport=make_transport(handler))
        try:
            response = client.post("/api/v1/sources/url", json={"url": "http://public.example.com/missing"})
        finally:
            ss.UrlFetcher = original
            settings.url_per_host_min_interval_ms = original
        assert response.status_code == 502
        assert response.json()["error"] == "url_fetch_failed"

    def test_http_500_maps_to_502(self, client: TestClient) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(500, text="boom")

        settings = get_settings()
        settings.url_per_host_min_interval_ms = 0
        import app.services.source_service as ss

        original = ss.UrlFetcher
        ss.UrlFetcher = lambda: UrlFetcher(transport=make_transport(handler))
        try:
            response = client.post("/api/v1/sources/url", json={"url": "http://public.example.com/exploding"})
        finally:
            ss.UrlFetcher = original
            settings.url_per_host_min_interval_ms = original
        assert response.status_code == 502

    def test_timeout_maps_to_502(self, client: TestClient) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ConnectTimeout("timed out")

        settings = get_settings()
        settings.url_per_host_min_interval_ms = 0
        import app.services.source_service as ss

        original = ss.UrlFetcher
        ss.UrlFetcher = lambda: UrlFetcher(transport=make_transport(handler))
        try:
            response = client.post("/api/v1/sources/url", json={"url": "http://public.example.com/slow"})
        finally:
            ss.UrlFetcher = original
            settings.url_per_host_min_interval_ms = original
        assert response.status_code == 502

    def test_non_html_content_rejected_422(self, client: TestClient) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=b"\x89PNG fake image bytes", headers={"Content-Type": "image/png"})

        settings = get_settings()
        settings.url_per_host_min_interval_ms = 0
        import app.services.source_service as ss

        original = ss.UrlFetcher
        ss.UrlFetcher = lambda: UrlFetcher(transport=make_transport(handler))
        try:
            response = client.post("/api/v1/sources/url", json={"url": "http://public.example.com/pic.png"})
        finally:
            ss.UrlFetcher = original
            settings.url_per_host_min_interval_ms = original
        assert response.status_code == 422
        assert "HTML" in response.json()["message"]

    def test_response_size_cap_enforced(self, client: TestClient) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, text=HTML_PAGE, headers={"Content-Type": "text/html"})

        settings = get_settings()
        original_mb = settings.max_url_response_mb
        original_interval = settings.url_per_host_min_interval_ms
        settings.max_url_response_mb = 0  # 0 MB * 1024^2 — any body exceeds
        settings.url_per_host_min_interval_ms = 0
        import app.services.source_service as ss

        original = ss.UrlFetcher
        ss.UrlFetcher = lambda: UrlFetcher(transport=make_transport(handler))
        try:
            response = client.post("/api/v1/sources/url", json={"url": "http://public.example.com/huge"})
        finally:
            ss.UrlFetcher = original
            settings.max_url_response_mb = original_mb
            settings.url_per_host_min_interval_ms = original_interval
        assert response.status_code == 502
        assert "maximum size" in response.json()["message"]

    def test_bad_url_rejected_400(self, client: TestClient) -> None:
        """Scheme violations surface as 400 invalid_request (URL contract)."""
        response = client.post("/api/v1/sources/url", json={"url": "ftp://example.com/file"})
        assert response.status_code == 400
        assert response.json()["error"] == "invalid_request"

    def test_malformed_url_rejected_400(self, client: TestClient) -> None:
        response = client.post("/api/v1/sources/url", json={"url": "http://[bad-parse/"})
        assert response.status_code in (400, 422)


# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------

class TestRateLimiting:
    def test_second_immediate_fetch_to_same_host_rejected(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, text=HTML_PAGE, headers={"Content-Type": "text/html"})

        fetcher = fetcher_with(handler)
        settings = get_settings()
        original = settings.url_per_host_min_interval_ms
        settings.url_per_host_min_interval_ms = 1000

        # Bypass network: patch transport call to avoid real sockets
        import socket as socket_mod

        monkeypatch_dns = [(2, 1, 6, "", ("93.184.216.34", 0))]
        original_getaddrinfo = socket_mod.getaddrinfo
        socket_mod.getaddrinfo = lambda *a, **k: monkeypatch_dns
        try:
            fetcher.fetch("http://public.example.com/a")
            with pytest.raises(RateLimitedError):
                fetcher.fetch("http://public.example.com/b")
        finally:
            socket_mod.getaddrinfo = original_getaddrinfo
            settings.url_per_host_min_interval_ms = original


# ---------------------------------------------------------------------------
# Legacy register-only behaviour
# ---------------------------------------------------------------------------

class TestRegisterOnlyMode:
    def test_fetch_false_registers_without_network(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/sources/url",
            json={"url": "https://example.org/some-article", "fetch": False},
        )
        assert response.status_code == 201, response.text
        data = response.json()["data"]
        assert data["source_type"] == "URL"
        assert data["source_url"] == "https://example.org/some-article"
        assert data["text_content"] is None
        assert data["processor_metadata"] is None
        assert response.json()["message"] == "URL source registered successfully"

    def test_fetch_false_ignores_unreachable_hosts(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/sources/url",
            json={"url": "https://this-host-does-not-exist.example/x", "fetch": False},
        )
        assert response.status_code == 201
        assert response.json()["data"]["text_content"] is None


# ---------------------------------------------------------------------------
# Source model integration
# ---------------------------------------------------------------------------

def test_list_sources_filter_url(client: TestClient) -> None:
    client.post("/api/v1/sources/url", json={"url": "https://a.example/1", "fetch": False})
    client.post("/api/v1/sources/url", json={"url": "https://b.example/2", "fetch": False})
    response = client.get("/api/v1/sources", params={"source_type": "URL"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) >= 2
    assert all(s["source_type"] == "URL" for s in data)
