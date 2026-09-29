"""Document processor — extracts text from PDF, DOCX and TXT uploads.

Phase 3A scope: mechanical text extraction only. Scanned/image-only PDFs
are rejected with ExtractionError; OCR arrives in Phase 4.
"""

import io
from pathlib import Path

import charset_normalizer
from docx import Document as DocxDocument
from pypdf import PdfReader

from app.processors.base import ExtractionError, ProcessorResult, SourceProcessor
from app.processors.text import normalize_text

PDF_MIME = "application/pdf"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
TXT_MIME = "text/plain"

_MIME_BY_EXTENSION = {
    ".pdf": PDF_MIME,
    ".docx": DOCX_MIME,
    ".txt": TXT_MIME,
}

# Extensions the processor can physically parse (allowlist enforcement
# happens in the service layer using configuration).
SUPPORTED_EXTENSIONS = set(_MIME_BY_EXTENSION)


def mime_type_for(filename: str) -> str | None:
    """MIME type for a filename based on its extension, or None."""
    return _MIME_BY_EXTENSION.get(Path(filename).suffix.lower())


class DocumentProcessor(SourceProcessor):
    """Processor for DOCUMENT sources (PDF / DOCX / TXT)."""

    supported_type = "DOCUMENT"

    def process(self, payload: bytes, filename: str | None = None) -> ProcessorResult:
        """Dispatch on extension and extract text."""
        if not payload:
            raise ExtractionError("Uploaded file is empty")

        extension = Path(filename or "").suffix.lower()
        if extension == ".pdf":
            return self._process_pdf(payload)
        if extension == ".docx":
            return self._process_docx(payload)
        if extension == ".txt":
            return self._process_txt(payload)
        raise ExtractionError(f"Unsupported document extension: {extension or '(none)'}")

    # ------------------------------------------------------------------ PDF
    def _process_pdf(self, payload: bytes) -> ProcessorResult:
        warnings: list[str] = []
        try:
            reader = PdfReader(io.BytesIO(payload))
        except Exception as exc:  # pypdf raises a zoo of parse errors
            raise ExtractionError("File is not a readable PDF document") from exc

        pages: list[str] = []
        for index, page in enumerate(reader.pages):
            try:
                pages.append(page.extract_text() or "")
            except Exception:  # noqa: BLE001 — a bad page must not kill the upload
                warnings.append(f"page {index + 1} could not be read")

        joined = "\n\n".join(part for part in pages if part.strip())
        normalized, normalize_warnings = normalize_text(joined)
        warnings.extend(normalize_warnings)

        if not normalized:
            raise ExtractionError(
                "No extractable text found — the PDF may be scanned or image-based. "
                "OCR support arrives in Phase 4."
            )

        return ProcessorResult(
            text_content=normalized,
            mime_type=PDF_MIME,
            metadata={
                "page_count": str(len(reader.pages)),
                "word_count": str(len(normalized.split())),
                "extraction_engine": "pypdf",
            },
            warnings=warnings,
        )

    # ----------------------------------------------------------------- DOCX
    def _process_docx(self, payload: bytes) -> ProcessorResult:
        try:
            document = DocxDocument(io.BytesIO(payload))
        except Exception as exc:
            raise ExtractionError("File is not a readable DOCX document") from exc

        paragraphs = [p.text for p in document.paragraphs]
        normalized, warnings = normalize_text("\n".join(paragraphs))

        if not normalized:
            raise ExtractionError("DOCX document contains no extractable text")

        return ProcessorResult(
            text_content=normalized,
            mime_type=DOCX_MIME,
            metadata={
                "paragraph_count": str(len(paragraphs)),
                "word_count": str(len(normalized.split())),
                "extraction_engine": "python-docx",
            },
            warnings=warnings,
        )

    # ------------------------------------------------------------------ TXT
    def _process_txt(self, payload: bytes) -> ProcessorResult:
        decode_result = charset_normalizer.from_bytes(payload).best()
        if decode_result is None:
            raise ExtractionError("Text file could not be decoded (unknown encoding)")

        text = str(decode_result)
        encoding_used = decode_result.encoding or "utf-8"

        normalized, warnings = normalize_text(text)
        if not normalized:
            raise ExtractionError("Text file contains no content after normalisation")

        return ProcessorResult(
            text_content=normalized,
            mime_type=TXT_MIME,
            metadata={
                "detected_encoding": encoding_used,
                "word_count": str(len(normalized.split())),
                "extraction_engine": "charset-normalizer",
            },
            warnings=warnings,
        )
