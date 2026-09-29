"""Document processor placeholder (PDF/DOCX/TXT) — implemented in Phase 3."""

from app.processors.base import SourceProcessor


class DocumentProcessor(SourceProcessor):
    supported_type = "DOCUMENT"

    # Phase 3 will use a PDF/DOCX extraction library; no heavy deps in Phase 2.
