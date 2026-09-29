"""Video processor placeholder (frames + speech-to-text) — implemented in Phase 3/4."""

from app.processors.base import SourceProcessor


class VideoProcessor(SourceProcessor):
    supported_type = "VIDEO"

    # Phase 3 handles upload/metadata; Phase 4 adds scene/audio understanding.
