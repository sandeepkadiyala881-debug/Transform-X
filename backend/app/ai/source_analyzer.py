"""Source analyzer boundary — implemented in Phase 4.

Will analyse a normalised source and produce the "Source Intelligence"
payload the Phase-1 frontend already renders (content type, language,
key topics, entities, confidence).
"""

from dataclasses import dataclass, field


@dataclass
class SourceAnalysis:
    """Structured source intelligence (Phase 4 contract)."""

    content_type: str | None = None
    language: str | None = None
    estimated_length: str | None = None
    key_topics: list[str] = field(default_factory=list)
    entities: dict[str, list[str]] = field(default_factory=dict)
    confidence: float | None = None


def analyze_source(source_id: int) -> SourceAnalysis:
    """Analyse a stored source. Phase 4 implementation; stub raises for now."""
    raise NotImplementedError("Source analysis arrives in Phase 4")
