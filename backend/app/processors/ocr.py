"""OCR engine wrapper — RapidOCR (ONNX Runtime, models bundled in-wheel).

The engine is heavy to initialise (~2-3s cold start), so a single instance
is created lazily and reused process-wide. ``is_available()`` lets callers
degrade gracefully when OCR dependencies are absent.
"""

from __future__ import annotations

import threading
from dataclasses import dataclass

from app.utils.logging import get_logger

logger = get_logger("ocr")

_ENGINE_LOCK = threading.Lock()
_ENGINE: "RapidOCREngine | None" = None


@dataclass
class OcrLine:
    """One recognised text line with its mean confidence."""

    text: str
    confidence: float


class RapidOCREngine:
    """Lazy singleton wrapper around RapidOCR."""

    def __init__(self) -> None:
        from rapidocr_onnxruntime import RapidOCR

        self._engine = RapidOCR()

    def recognize(self, png_bytes: bytes) -> list[OcrLine]:
        """Run OCR on a PNG-encoded image, returning recognised lines."""
        result, _elapsed = self._engine(png_bytes)
        lines: list[OcrLine] = []
        for row in result or []:
            # RapidOCR row shape: [bbox, text, confidence]
            text = str(row[1]).strip()
            if not text:
                continue
            try:
                confidence = float(row[2])
            except (TypeError, ValueError):
                confidence = 0.0
            lines.append(OcrLine(text=text, confidence=confidence))
        return lines


def get_ocr_engine() -> RapidOCREngine:
    """Return the process-wide engine, creating it on first use."""
    global _ENGINE
    with _ENGINE_LOCK:
        if _ENGINE is None:
            logger.info("initialising RapidOCR engine")
            _ENGINE = RapidOCREngine()
        return _ENGINE


def is_available() -> bool:
    """True when the OCR dependencies import successfully."""
    try:
        import rapidocr_onnxruntime  # noqa: F401

        return True
    except ImportError:
        return False
