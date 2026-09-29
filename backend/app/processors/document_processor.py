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
            # Phase 3B: scanned/image-only PDFs fall back to OCR instead of
            # being rejected. Pages are rendered to bitmaps (pypdfium2) and
            # passed through the same OCR engine as image uploads.
            normalized, ocr_warnings, ocr_pages = self._ocr_scanned_pdf(payload, len(reader.pages))
            warnings.extend(ocr_warnings)
            if not normalized:
                raise ExtractionError(
                    "No extractable text found — the PDF may be scanned or "
                    "image-based, and OCR recognised no text."
                )

            return ProcessorResult(
                text_content=normalized,
                mime_type=PDF_MIME,
                metadata={
                    "page_count": str(len(reader.pages)),
                    "ocr_page_count": str(ocr_pages),
                    "word_count": str(len(normalized.split())),
                    "extraction_engine": "pypdfium2+rapidocr",
                },
                warnings=warnings,
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

    # ------------------------------------------------------- scanned PDF OCR
    def _ocr_scanned_pdf(self, payload: bytes, page_count: int) -> tuple[str, list[str], int]:
        """Render PDF pages to bitmaps and OCR them.

        Returns (text, warnings, pages_ocr'd). Degrades to empty text when
        pypdfium2 or the OCR engine is unavailable.
        """
        warnings: list[str] = []
        try:
            import pypdfium2 as pdfium
        except ImportError:
            warnings.append("PDF rendering unavailable for OCR")
            return "", warnings, 0

        from app.processors.ocr import get_ocr_engine
        from app.processors.text import normalize_text as _normalize

        try:
            pdf = pdfium.PdfDocument(io.BytesIO(payload))
        except Exception as exc:
            raise ExtractionError("File is not a readable PDF document") from exc

        parts: list[str] = []
        pages_ocrd = 0
        render_scale = 200 / 72  # 200 DPI
        for index in range(len(pdf)):
            try:
                bitmap = pdf[index].render(scale=render_scale)
                pil_image = bitmap.to_pil().convert("L")
            except Exception:  # noqa: BLE001 — one bad page must not kill the upload
                warnings.append(f"page {index + 1} could not be rendered for OCR")
                continue

            buffer = io.BytesIO()
            pil_image.save(buffer, format="PNG")
            lines = get_ocr_engine().recognize(buffer.getvalue())
            if lines:
                pages_ocrd += 1
                parts.append("\n".join(line.text for line in lines))

        text, normalize_warnings = _normalize("\n\n".join(parts))
        warnings.extend(normalize_warnings)
        if pages_ocrd:
            warnings.append(f"{pages_ocrd} of {page_count} pages used OCR")
        return text, warnings, pages_ocrd

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
