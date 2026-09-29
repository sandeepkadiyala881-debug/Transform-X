"""Image processor — OCR-based text extraction for image sources.

Pipeline: decode-verify with Pillow (catches mislabelled files) →
decompression-bomb pixel guard → EXIF auto-orient → grayscale →
long-edge cap → PNG re-encode → RapidOCR → normalised text.
"""

import io
from dataclasses import dataclass

from PIL import Image, ImageOps

from app.config import get_settings
from app.processors.base import ExtractionError, ProcessorResult, SourceProcessor
from app.processors.ocr import get_ocr_engine
from app.processors.text import normalize_text

# Re-encode target: strips malicious ancillary chunks before OCR.
OCR_INPUT_FORMAT = "PNG"
# Cap the long edge before OCR — beyond this, accuracy plateaus and cost grows.
MAX_OCR_LONG_EDGE = 3000


@dataclass
class PreparedImage:
    """A validated, normalised image ready for OCR."""

    image: Image.Image
    width: int
    height: int
    format: str
    warnings: list[str]


class ImageProcessor(SourceProcessor):
    """Processor for IMAGE sources (PNG / JPEG / WEBP)."""

    supported_type = "IMAGE"

    def process(self, payload: bytes, filename: str | None = None) -> ProcessorResult:
        if not payload:
            raise ExtractionError("Uploaded image is empty")

        prepared = self._prepare(payload)
        ocr_lines = self._run_ocr(prepared)

        if not ocr_lines:
            raise ExtractionError(
                "No text could be recognised in the image. "
                "Ensure the image contains readable text."
            )

        raw_text = "\n".join(line.text for line in ocr_lines)
        normalized, normalize_warnings = normalize_text(raw_text)
        warnings = prepared.warnings + normalize_warnings

        confidences = [line.confidence for line in ocr_lines]
        mean_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        return ProcessorResult(
            text_content=normalized or None,
            mime_type=f"image/{prepared.format.lower()}",
            metadata={
                "image_width": str(prepared.width),
                "image_height": str(prepared.height),
                "image_format": prepared.format,
                "ocr_line_count": str(len(ocr_lines)),
                "ocr_mean_confidence": f"{mean_confidence:.4f}",
                "word_count": str(len(normalized.split())) if normalized else "0",
                "extraction_engine": "rapidocr",
            },
            warnings=warnings,
        )

    # ------------------------------------------------------------- pipeline
    def _prepare(self, payload: bytes) -> PreparedImage:
        """Decode, validate and normalise the image for OCR."""
        settings = get_settings()
        warnings: list[str] = []

        try:
            image = Image.open(io.BytesIO(payload))
            image.load()  # force full decode; catches truncated/corrupt files
        except Exception as exc:
            raise ExtractionError("File is not a readable image") from exc

        # Capture the true container format before any transforms (format is
        # lost after exif_transpose/convert/resize).
        original_format = (image.format or "PNG").upper()
        if original_format == "JPG":
            original_format = "JPEG"

        width, height = image.size
        if width * height > settings.max_image_pixels:
            raise ExtractionError(
                "Image exceeds the maximum allowed pixel count",  # mapped to 422
            )

        # EXIF orientation (phone photos): normalise before OCR.
        try:
            orientation = image.getexif().get(274)  # 274 = Orientation tag
            oriented = ImageOps.exif_transpose(image)
            if orientation and orientation != 1:
                warnings.append("orientation corrected from EXIF")
            image = oriented
        except Exception:  # noqa: BLE001 — broken EXIF must not fail the upload
            warnings.append("EXIF orientation data unreadable")

        # Grayscale improves OCR on coloured backgrounds.
        image = image.convert("L")

        long_edge = max(image.size)
        if long_edge > MAX_OCR_LONG_EDGE:
            scale = MAX_OCR_LONG_EDGE / long_edge
            image = image.resize(
                (max(1, int(image.width * scale)), max(1, int(image.height * scale))),
                Image.LANCZOS,
            )
            warnings.append(f"resized from {width}x{height} for OCR")

        return PreparedImage(
            image=image,
            width=width,
            height=height,
            format=original_format,
            warnings=warnings,
        )

    def _run_ocr(self, prepared: PreparedImage) -> list:
        """Encode to PNG and OCR, preserving detected line order."""
        buffer = io.BytesIO()
        prepared.image.save(buffer, format=OCR_INPUT_FORMAT)
        engine = get_ocr_engine()
        return engine.recognize(buffer.getvalue())
