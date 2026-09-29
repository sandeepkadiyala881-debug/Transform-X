"""Input processors — architectural boundary for Phase 3.

Each processor will turn one source kind into a normalised source record
(extracted text, metadata, language). Phase 2 ships only the contracts;
implementations and heavy dependencies (PDF/DOCX/OCR/video) arrive in
Phase 3 without changing the API surface.
"""

from app.processors.base import ProcessorResult, SourceProcessor, ProcessorNotImplementedError

__all__ = ["ProcessorResult", "SourceProcessor", "ProcessorNotImplementedError"]
