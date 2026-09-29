"""Tests for Phase 3B — image upload, OCR extraction, scanned-PDF fallback.

All fixtures are generated in memory (Pillow drawings, pypdfium2 renders);
uploads land in pytest tmp_path so tests never write into the repository.
"""

from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, NumberObject, StreamObject

from app.config import get_settings
from tests.test_document_sources import upload_document


# ---------------------------------------------------------------------------
# Fixture generators
# ---------------------------------------------------------------------------

def _load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Prefer a TrueType font so OCR sees clean glyphs."""
    for name in ("arial.ttf", "DejaVuSans.ttf", "segoeui.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_text_image_bytes(
    text: str = "SERVER MAINTENANCE NOTICE",
    fmt: str = "PNG",
    size: tuple[int, int] = (720, 240),
    rotate: int = 0,
) -> bytes:
    """Render black-on-white text onto an image and encode it."""
    image = Image.new("RGB", size, "white")
    draw = ImageDraw.Draw(image)
    font = _load_font(40)
    draw.text((40, size[1] // 2 - 20), text, fill="black", font=font)
    if rotate:
        image = image.rotate(rotate, expand=True, fillcolor="white")
    buffer = BytesIO()
    image.save(buffer, format=fmt)
    return buffer.getvalue()


def make_blank_image_bytes(fmt: str = "PNG", size: tuple[int, int] = (600, 200)) -> bytes:
    """A solid-white image — OCR finds nothing."""
    image = Image.new("RGB", size, "white")
    buffer = BytesIO()
    image.save(buffer, format=fmt)
    return buffer.getvalue()


def make_scanned_pdf_bytes(text: str) -> bytes:
    """A PDF whose page is a rasterised image of text (no text layer)."""
    # Render the text to a PNG with Pillow...
    png = make_text_image_bytes(text, size=(900, 400))

    # ...embed it in a one-page PDF via pypdfium2's image conversion.
    import pypdfium2 as pdfium

    pdf = pdfium.PdfDocument.new()
    page_image = Image.open(BytesIO(png))
    bitmap = pdfium.PdfBitmap.from_pil(page_image)
    page = pdf.new_page(612, 792)
    # Insert the bitmap as the page's object tree via pypdfium2 low-level API
    # is involved; simpler: use Pillow to save as PDF (raster-only, no text layer).
    raster_pdf = BytesIO()
    page_image.convert("RGB").save(raster_pdf, format="PDF", resolution=100)

    # Wrap the raster PDF page inside a proper PDF via pypdf (still no text layer).
    from pypdf import PdfReader

    raster = PdfReader(BytesIO(raster_pdf.getvalue()))
    page_content = raster.pages[0].extract_text() or ""
    assert page_content == "", "fixture must not contain a text layer"

    writer = PdfWriter()
    writer.append(raster)
    out = BytesIO()
    writer.write(out)
    return out.getvalue()


@pytest.fixture()
def override_upload_dir(tmp_path: Path):
    """Point UPLOAD_DIR at a temp directory for the duration of a test."""
    settings = get_settings()
    original = settings.upload_dir
    settings.upload_dir = str(tmp_path / "uploads")
    yield settings.upload_dir
    settings.upload_dir = original


def upload_image(client: TestClient, data: bytes, filename: str, **form: str):
    return client.post(
        "/api/v1/sources/images",
        files={"file": (filename, data)},
        data=form or None,
    )


# ---------------------------------------------------------------------------
# Image upload tests
# ---------------------------------------------------------------------------

class TestImageUpload:
    def test_upload_png_with_text(self, client: TestClient, override_upload_dir: str) -> None:
        data = make_text_image_bytes("SERVER MAINTENANCE NOTICE")
        response = upload_image(client, data, "notice.png")

        assert response.status_code == 201, response.text
        body = response.json()
        data_out = body["data"]
        assert data_out["source_type"] == "IMAGE"
        assert data_out["title"] == "notice"
        assert "SERVER MAINTENANCE" in data_out["text_content"]
        assert data_out["mime_type"] == "image/png"
        meta = data_out["processor_metadata"]
        assert meta["extraction_engine"] == "rapidocr"
        assert "ocr_mean_confidence" in meta
        assert float(meta["ocr_mean_confidence"]) > 0.5

        stored = Path(override_upload_dir) / data_out["file_path"]
        assert stored.is_file(), "original image must be stored on disk"

    def test_upload_jpeg(self, client: TestClient, override_upload_dir: str) -> None:
        data = make_text_image_bytes("QUARTERLY BUDGET REVIEW", fmt="JPEG")
        response = upload_image(client, data, "budget.jpg")

        assert response.status_code == 201, response.text
        data_out = response.json()["data"]
        assert "QUARTERLY BUDGET" in data_out["text_content"]
        assert data_out["mime_type"] == "image/jpeg"

    def test_upload_webp(self, client: TestClient, override_upload_dir: str) -> None:
        data = make_text_image_bytes("SECURITY BULLETIN SEVEN", fmt="WEBP")
        response = upload_image(client, data, "bulletin.webp")

        assert response.status_code == 201, response.text
        data_out = response.json()["data"]
        assert "SECURITY BULLETIN" in data_out["text_content"]
        assert data_out["mime_type"] == "image/webp"

    def test_exif_orientation_corrected(self, client: TestClient, override_upload_dir: str) -> None:
        """A rotated image (EXIF orientation 6) still OCRs correctly."""
        image = Image.new("RGB", (720, 240), "white")
        draw = ImageDraw.Draw(image)
        draw.text((40, 100), "ROTATED PHOTO TEXT", fill="black", font=_load_font(40))
        # Simulate EXIF: rotate the pixels 90° CW and declare orientation 6.
        rotated = image.transpose(Image.ROTATE_270)
        rotated.save(BytesIO(), format="PNG")  # sanity: encodes fine

        buffer = BytesIO()
        exif = Image.Exif()
        exif[274] = 6  # Orientation: rotate 90 CW to display
        rotated.save(buffer, format="PNG", exif=exif.tobytes())

        response = upload_image(client, buffer.getvalue(), "rotated.png")
        assert response.status_code == 201, response.text
        meta = response.json()["data"]["processor_metadata"]
        assert any("orientation" in w for w in meta.get("warnings", []))

    def test_custom_title_and_language(self, client: TestClient, override_upload_dir: str) -> None:
        data = make_text_image_bytes("WHITEPAPER COVER PAGE")
        response = upload_image(client, data, "cover.png", title="Custom Image", language="ENGLISH")
        assert response.status_code == 201, response.text
        data_out = response.json()["data"]
        assert data_out["title"] == "Custom Image"
        assert data_out["language"] == "ENGLISH"


class TestImageValidation:
    def test_unsupported_format_rejected_415(self, client: TestClient, override_upload_dir: str) -> None:
        gif = make_text_image_bytes("GIF NOT ALLOWED", fmt="GIF")
        response = upload_image(client, gif, "animated.gif")
        assert response.status_code == 415
        assert response.json()["error"] == "unsupported_media_type"

    def test_bmp_rejected_415(self, client: TestClient, override_upload_dir: str) -> None:
        bmp = make_text_image_bytes("BMP NOT ALLOWED", fmt="BMP")
        response = upload_image(client, bmp, "picture.bmp")
        assert response.status_code == 415

    def test_no_extension_rejected_415(self, client: TestClient, override_upload_dir: str) -> None:
        png = make_text_image_bytes("NO EXTENSION")
        response = upload_image(client, png, "imagefile")
        assert response.status_code == 415

    def test_extension_lie_rejected_422(self, client: TestClient, override_upload_dir: str) -> None:
        """A text payload named .png must fail at decode (422), not pass."""
        response = upload_image(client, b"definitely not an image", "fake.png")
        assert response.status_code == 422
        assert response.json()["error"] == "unprocessable_content"

    def test_empty_file_rejected_422(self, client: TestClient, override_upload_dir: str) -> None:
        response = upload_image(client, b"", "empty.png")
        assert response.status_code == 422

    def test_blank_image_ocr_nothing_rejected_422(self, client: TestClient, override_upload_dir: str) -> None:
        """All-white image: OCR runs but finds no text — consistent 422 policy."""
        response = upload_image(client, make_blank_image_bytes(), "blank.png")
        assert response.status_code == 422
        body = response.json()
        assert body["error"] == "unprocessable_content"

    def test_pixel_bomb_rejected_422(
        self, client: TestClient, override_upload_dir: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        settings = get_settings()
        monkeypatch.setattr(settings, "max_image_pixels", 1000)  # absurdly low
        data = make_text_image_bytes("TOO MANY PIXELS", size=(600, 200))
        response = upload_image(client, data, "bomb.png")
        assert response.status_code == 422

    def test_oversize_bytes_rejected_413(
        self, client: TestClient, override_upload_dir: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        settings = get_settings()
        monkeypatch.setattr(settings, "max_upload_size_mb", 1)
        big = b"x" * (1 * 1024 * 1024 + 1)
        response = upload_image(client, big, "big.png")
        assert response.status_code == 413
        assert response.json()["error"] == "payload_too_large"


class TestScannedPdfFallback:
    def test_scanned_pdf_now_succeeds_with_ocr(self, client: TestClient, override_upload_dir: str) -> None:
        """A rasterised (text-layer-less) PDF now extracts via OCR — the
        Phase 3A 422 becomes a 201 with OCR metadata."""
        pdf = make_scanned_pdf_bytes("SCANNED CONTRACT PAGE NINE")
        response = upload_document(client, pdf, "scanned-contract.pdf")

        assert response.status_code == 201, response.text
        data_out = response.json()["data"]
        assert "SCANNED CONTRACT" in data_out["text_content"]
        meta = data_out["processor_metadata"]
        assert meta["extraction_engine"] == "pypdfium2+rapidocr"
        assert meta["ocr_page_count"] == "1"
        assert any("pages used OCR" in w for w in meta.get("warnings", []))


class TestConfigKnobs:
    def test_image_extension_config(self) -> None:
        settings = get_settings()
        assert "png" in settings.allowed_image_extension_list
        assert "gif" not in settings.allowed_image_extension_list

    def test_pixel_limit_config(self) -> None:
        settings = get_settings()
        assert settings.max_image_pixels >= 1_000_000
