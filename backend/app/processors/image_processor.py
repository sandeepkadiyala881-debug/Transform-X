"""Image processor placeholder (OCR + captioning) — implemented in Phase 3/4."""

from app.processors.base import SourceProcessor


class ImageProcessor(SourceProcessor):
    supported_type = "IMAGE"

    # Phase 3 handles upload/metadata; Phase 4 adds OCR/vision understanding.
