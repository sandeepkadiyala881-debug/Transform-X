"""Processor contract.

A processor receives raw input for one source kind and returns a normalised
result the platform can store and, later, analyse. Keeping this boundary
stable lets Phase 3 add implementations without API changes.
"""

from dataclasses import dataclass, field


class ProcessorNotImplementedError(NotImplementedError):
    """Raised when a processor has not been implemented for the current phase."""


@dataclass
class ProcessorResult:
    """Normalised output of processing one source."""

    text_content: str | None = None
    language: str | None = None
    mime_type: str | None = None
    metadata: dict[str, str] = field(default_factory=dict)


class SourceProcessor:
    """Base class for source-kind processors."""

    supported_type: str = ""

    def process(self, payload: bytes, filename: str | None = None) -> ProcessorResult:
        """Process raw bytes into a normalised result."""
        raise ProcessorNotImplementedError(
            f"{type(self).__name__} arrives in Phase 3 (input processing)"
        )
