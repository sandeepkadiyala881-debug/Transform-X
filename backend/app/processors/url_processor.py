"""URL processor placeholder (article scraping) — implemented in Phase 3."""

from app.processors.base import SourceProcessor


class UrlProcessor(SourceProcessor):
    supported_type = "URL"

    # Phase 3 will fetch and extract article text; no scraping in Phase 2.
