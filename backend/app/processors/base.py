"""Processor contract.

A processor receives raw input for one source kind and returns a normalised
result the platform can store and, later, analyse. Keeping this boundary
stable lets later phases add implementations without API changes.
"""

from dataclasses import dataclass, field


class ProcessorNotImplementedError(NotImplementedError):
    """Raised when a processor has not been implemented for the current phase."""


class UnsupportedSourceError(Exception):
    """The uploaded payload's type/extension is outside the allowlist (HTTP 415)."""


class ExtractionError(Exception):
    """The payload could not be parsed, or contains no extractable text (HTTP 422)."""


@dataclass
class ProcessorResult:
    """Normalised output of processing one source."""

    text_content: str | None = None
    language: str | None = None
    mime_type: str | None = None
    metadata: dict[str, str] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)


class SourceProcessor:
    """Base class for source-kind processors."""

    supported_type: str = ""

    def process(self, payload: bytes, filename: str | None = None) -> ProcessorResult:
        """Process raw bytes into a normalised result."""
        raise ProcessorNotImplementedError(
            f"{type(self).__name__} is not implemented for this source kind"
        )
