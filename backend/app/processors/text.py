"""Text processor — normalisation for pasted or extracted plain text.

Phase 3A scope: mechanical cleanup only (encoding, control characters,
whitespace). No understanding, no AI — that is Phase 4.
"""

import unicodedata

from app.processors.base import ProcessorResult, SourceProcessor

# Characters stripped outright: control chars except tab/newline/CR.
_STRIP_CATEGORIES = {"Cc", "Cf"}


def normalize_text(raw: str) -> tuple[str, list[str]]:
    """Clean raw text and return (normalized, warnings).

    - Strips BOM and zero-width/control characters
    - Normalises Unicode to NFC (stable storage + comparisons)
    - Collapses 3+ blank lines to a paragraph break
    - Trims trailing whitespace on lines
    """
    warnings: list[str] = []

    text = raw.replace("\ufeff", "")
    cleaned = "".join(
        ch for ch in text if not (unicodedata.category(ch) in _STRIP_CATEGORIES and ch not in "\t\n\r")
    )
    if len(cleaned) != len(text):
        warnings.append("removed control or zero-width characters")

    normalized = unicodedata.normalize("NFC", cleaned)

    lines = [line.rstrip() for line in normalized.splitlines()]
    normalized = "\n".join(lines)

    # Collapse runs of blank lines to at most one blank line.
    paragraphs: list[str] = []
    blank_run = 0
    for line in normalized.split("\n"):
        if line == "":
            blank_run += 1
            if blank_run <= 1:
                paragraphs.append(line)
        else:
            blank_run = 0
            paragraphs.append(line)
    normalized = "\n".join(paragraphs).strip()

    if not normalized:
        warnings.append("no text content after normalisation")

    return normalized, warnings


class TextProcessor(SourceProcessor):
    """Processor for TEXT sources (pasted content)."""

    supported_type = "TEXT"

    def process_text(self, raw: str) -> ProcessorResult:
        normalized, warnings = normalize_text(raw)
        return ProcessorResult(
            text_content=normalized or None,
            mime_type="text/plain",
            metadata={"word_count": str(len(normalized.split())) if normalized else "0"},
            warnings=warnings,
        )
