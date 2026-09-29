"""Tests for Phase 3A — document upload and text extraction.

Fixtures (PDF/DOCX) are generated on the fly; uploads are redirected to
pytest's tmp_path so tests never write into the repository.
"""

from io import BytesIO
from pathlib import Path

import pytest
from docx import Document as DocxDocument
from fastapi.testclient import TestClient
from pypdf import PdfWriter
from pypdf.generic import (
    DictionaryObject,
    NameObject,
    NumberObject,
    StreamObject,
)

from app.config import get_settings


# ---------------------------------------------------------------------------
# Fixture generators (no binary blobs committed to the repo)
# ---------------------------------------------------------------------------

def make_pdf_bytes(text_lines: list[str]) -> bytes:
    """Build a valid single-page PDF containing the given text lines."""
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    page = writer.pages[0]

    font = writer._add_object(
        DictionaryObject(
            {
                NameObject("/Type"): NameObject("/Font"),
                NameObject("/Subtype"): NameObject("/Type1"),
                NameObject("/BaseFont"): NameObject("/Helvetica"),
            }
        )
    )
    resources = DictionaryObject()
    resources[NameObject("/Font")] = DictionaryObject({NameObject("/F1"): font})

    content_parts: list[str] = ["BT", "/F1 12 Tf"]
    y = 720
    for line in text_lines:
        escaped = line.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
        content_parts.append(f"1 0 0 1 72 {y} Tm ({escaped}) Tj")
        y -= 20
    content_parts.append("ET")

    stream_bytes = "\n".join(content_parts).encode("latin-1", errors="replace")
    stream = StreamObject()
    stream.set_data(stream_bytes)
    stream_ref = writer._add_object(stream)

    page[NameObject("/Contents")] = stream_ref
    page[NameObject("/Resources")] = resources

    buffer = BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def make_docx_bytes(paragraphs: list[str]) -> bytes:
    """Build an in-memory DOCX containing the given paragraphs."""
    document = DocxDocument()
    for text in paragraphs:
        document.add_paragraph(text)
    buffer = BytesIO()
    document.save(buffer)
    return buffer.getvalue()


# ---------------------------------------------------------------------------
# Fixtures exposed to tests
# ---------------------------------------------------------------------------

@pytest.fixture()
def pdf_bytes() -> bytes:
    return make_pdf_bytes(
        [
            "INCIDENT REPORT - IR-2026-0847",
            "A credential phishing campaign targeted enterprise employees.",
            "Thirty-four accounts were quarantined by the SOC.",
        ]
    )


@pytest.fixture()
def docx_bytes() -> bytes:
    return make_docx_bytes(
        [
            "Quarterly Policy Summary",
            "The updated policy applies to all business units.",
            "Compliance reviews happen every quarter.",
        ]
    )


@pytest.fixture()
def override_upload_dir(tmp_path: Path):
    """Point UPLOAD_DIR at a temp directory for the duration of a test."""
    settings = get_settings()
    original = settings.upload_dir
    settings.upload_dir = str(tmp_path / "uploads")
    yield settings.upload_dir
    settings.upload_dir = original


def upload_document(client: TestClient, data: bytes, filename: str, **form: str):
    return client.post(
        "/api/v1/sources/documents",
        files={"file": (filename, data)},
        data=form or None,
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestDocumentUpload:
    def test_upload_txt_document(self, client: TestClient, override_upload_dir: str) -> None:
        content = "Line one of the report.\n\nLine two follows a blank line."
        response = upload_document(client, content.encode("utf-8"), "report.txt")

        assert response.status_code == 201, response.text
        data = response.json()["data"]
        assert data["source_type"] == "DOCUMENT"
        assert data["original_filename"] == "report.txt"
        assert data["title"] == "report"
        assert data["text_content"].startswith("Line one of the report.")
        assert data["mime_type"] == "text/plain"
        assert data["processor_metadata"]["extraction_engine"] == "charset-normalizer"

        stored = Path(override_upload_dir) / data["file_path"]
        assert stored.is_file(), "original file must be stored on disk"

    def test_upload_docx_document(self, client: TestClient, override_upload_dir: str, docx_bytes: bytes) -> None:
        response = upload_document(client, docx_bytes, "policy-brief.docx")

        assert response.status_code == 201, response.text
        data = response.json()["data"]
        assert data["title"] == "policy-brief"  # derived from filename
        assert "Quarterly Policy Summary" in data["text_content"]
        assert data["processor_metadata"]["extraction_engine"] == "python-docx"

    def test_upload_pdf_document(self, client: TestClient, override_upload_dir: str, pdf_bytes: bytes) -> None:
        response = upload_document(client, pdf_bytes, "incident-report.pdf")

        assert response.status_code == 201, response.text
        data = response.json()["data"]
        assert "credential phishing campaign" in data["text_content"]
        assert data["processor_metadata"]["extraction_engine"] == "pypdf"
        assert data["processor_metadata"]["page_count"] == "1"

    def test_custom_title_and_language(self, client: TestClient, override_upload_dir: str) -> None:
        response = upload_document(
            client,
            "Hello world".encode("utf-8"),
            "notes.txt",
            title="Custom Title",
            language="ENGLISH",
        )
        assert response.status_code == 201, response.text
        data = response.json()["data"]
        assert data["title"] == "Custom Title"
        assert data["language"] == "ENGLISH"

    def test_unsupported_extension_rejected_415(self, client: TestClient, override_upload_dir: str) -> None:
        response = upload_document(client, b"MZ fake exe", "malware.exe")
        assert response.status_code == 415
        assert response.json()["error"] == "unsupported_media_type"

    def test_no_extension_rejected_415(self, client: TestClient, override_upload_dir: str) -> None:
        response = upload_document(client, b"data", "README")
        assert response.status_code == 415

    def test_empty_file_rejected_422(self, client: TestClient, override_upload_dir: str) -> None:
        response = upload_document(client, b"", "empty.txt")
        assert response.status_code == 422
        assert response.json()["error"] == "unprocessable_content"

    def test_corrupt_pdf_rejected_422(self, client: TestClient, override_upload_dir: str) -> None:
        response = upload_document(client, b"%PDF-1.4 this is not a real pdf", "broken.pdf")
        assert response.status_code == 422
        assert response.json()["error"] == "unprocessable_content"


class TestScannedPdfPolicy:
    def test_textless_pdf_rejected_422(self, client: TestClient, override_upload_dir: str) -> None:
        """A PDF with no extractable text (scanned) must be rejected, per plan."""
        writer = PdfWriter()
        writer.add_blank_page(width=612, height=792)
        buffer = BytesIO()
        writer.write(buffer)

        response = upload_document(client, buffer.getvalue(), "scanned.pdf")
        assert response.status_code == 422, response.text
        body = response.json()
        assert body["error"] == "unprocessable_content"
        # Phase 3B: OCR runs on scanned pages; a truly blank PDF still yields
        # no text and is rejected with the updated message.
        assert "OCR recognised no text" in body["message"]


class TestUploadLimits:
    def test_oversize_rejected_413(
        self, client: TestClient, override_upload_dir: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        settings = get_settings()
        monkeypatch.setattr(settings, "max_upload_size_mb", 1)
        big = b"x" * (1 * 1024 * 1024 + 1)
        response = upload_document(client, big, "big.txt")
        assert response.status_code == 413
        assert response.json()["error"] == "payload_too_large"


class TestPathTraversalSafety:
    def test_filename_path_components_stripped(self, client: TestClient, override_upload_dir: str) -> None:
        response = upload_document(client, "safe".encode("utf-8"), "..\\..\\evil.txt")
        assert response.status_code == 201, response.text
        data = response.json()["data"]
        assert "/" not in data["original_filename"]
        assert "\\" not in data["original_filename"]
        stored = Path(override_upload_dir) / data["file_path"]
        assert override_upload_dir in str(stored.resolve())
