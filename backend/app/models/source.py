"""Source model — information supplied by the operator."""

from typing import Any, Optional

from sqlalchemy import Enum as SAEnum
from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.domain import SourceType


class Source(TimestampMixin, Base):
    """A piece of information (text, document, image, video or URL) to transform.

    Phase 2 stores metadata only; content processing arrives in Phase 3.
    """

    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_type: Mapped[SourceType] = mapped_column(
        SAEnum(SourceType, name="source_type", native_enum=False, length=32), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(127), nullable=True)
    text_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    # Extraction details from Phase 3A processors: page/word counts, engine,
    # warnings. Named processor_metadata because `metadata` is reserved by
    # SQLAlchemy's Declarative API.
    processor_metadata: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
