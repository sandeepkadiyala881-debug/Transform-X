"""URL processor — extracts clean article text from fetched HTML.

Phase 3C scope: mechanical extraction with BeautifulSoup (stdlib html.parser,
no binary deps). No readability scoring, no JS rendering, no AI — those are
later phases.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from bs4 import BeautifulSoup

from app.processors.base import ExtractionError, ProcessorResult
from app.processors.text import normalize_text

# Elements whose entire subtree is dropped before text extraction.
STRIP_SELECTORS = ("script", "style", "noscript", "template", "svg", "iframe", "form", "nav", "footer", "aside")

# Elements whose text is gathered, in document order.
CONTENT_SELECTORS = "p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th, figcaption, pre"

# Tags treated as block-level so paragraph breaks survive extraction.
BLOCK_TAGS = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "td", "th", "figcaption", "pre", "br"}

_WHITESPACE_RE = re.compile(r"[ \t]+")


@dataclass
class HtmlExtraction:
    """Structured extraction result from one HTML document."""

    title: str | None = None
    description: str | None = None
    text: str = ""
    metadata: dict[str, str] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)


def _soup_text(element) -> str:
    """Text of an element with inline tags flattened and whitespace collapsed."""
    return _WHITESPACE_RE.sub(" ", element.get_text(" ", strip=True)).strip()


def extract_html(html: str, source_charset: str | None = None) -> HtmlExtraction:
    """Parse HTML and return title, description and clean body text."""
    if not html.strip():
        raise ExtractionError("Fetched page contains no HTML content")

    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception as exc:
        raise ExtractionError("HTML could not be parsed") from exc

    title = _soup_text(soup.title) if soup.title else None

    description = None
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc and meta_desc.get("content"):
        description = str(meta_desc["content"]).strip()
    if not description:
        og_desc = soup.find("meta", attrs={"property": "og:description"})
        if og_desc and og_desc.get("content"):
            description = str(og_desc["content"]).strip()

    # Drop non-content subtrees.
    for selector in STRIP_SELECTORS:
        for element in soup.find_all(selector):
            element.decompose()

    # Assemble body text in document order, honouring block boundaries.
    lines: list[str] = []
    for element in soup.select(CONTENT_SELECTORS):
        text = _soup_text(element)
        if not text:
            continue
        # Skip <li> items that are inside nested lists already captured via
        # their own <li> — get_text per element handles this naturally; only
        # deduplicate exact repeats from adjacent selectors.
        if lines and lines[-1] == text:
            continue
        lines.append(text)

    body_text, normalize_warnings = normalize_text("\n\n".join(lines))
    warnings = list(normalize_warnings)
    if not body_text:
        warnings.append("no readable text found in HTML")

    metadata: dict[str, str] = {}
    if title:
        metadata["html_title"] = title
    if description:
        metadata["html_description"] = description[:512]
    if source_charset:
        metadata["detected_encoding"] = source_charset

    return HtmlExtraction(
        title=title,
        description=description,
        text=body_text,
        metadata=metadata,
        warnings=warnings,
    )


class UrlProcessor:
    """Processor for URL sources (TEXT stays in TextProcessor)."""

    supported_type = "URL"

    def process(self, fetch_result) -> ProcessorResult:
        """Build a ProcessorResult from a UrlFetcher.FetchResult."""
        content_type = (fetch_result.content_type or "").split(";")[0].strip().lower()
        if content_type and content_type not in ("text/html", "application/xhtml+xml"):
            raise ExtractionError(
                f"URL does not return HTML content (received {content_type or 'unknown'})",
            )

        charset = None
        if fetch_result.content_type and "charset=" in fetch_result.content_type:
            charset = fetch_result.content_type.split("charset=")[-1].split(";")[0].strip()

        html = fetch_result.content.decode(charset or "utf-8", errors="replace")
        extraction = extract_html(html, source_charset=charset)

        if not extraction.text:
            raise ExtractionError("No readable text could be extracted from the page")

        metadata = dict(extraction.metadata)
        metadata.update(
            {
                "final_url": fetch_result.final_url,
                "http_status": str(fetch_result.status_code),
                "content_type": content_type or "unknown",
                "redirect_count": str(fetch_result.redirect_count),
                "fetched_byte_count": str(len(fetch_result.content)),
                "word_count": str(len(extraction.text.split())),
                "extraction_engine": "httpx+beautifulsoup",
            }
        )
        warnings = fetch_result.warnings + extraction.warnings

        return ProcessorResult(
            text_content=extraction.text,
            language=None,
            mime_type=content_type or "text/html",
            metadata=metadata,
            warnings=warnings,
        )
