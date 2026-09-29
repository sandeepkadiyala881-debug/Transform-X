"""Source service — business logic for operator sources."""

from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain import SourceType
from app.models import Source
from app.processors.base import ExtractionError
from app.processors.document_processor import DocumentProcessor, mime_type_for
from app.processors.text import TextProcessor
from app.schemas.source import SourceCreateText
from app.services.file_storage import FileStorageService
from app.utils.errors import NotFoundError, ValidationError
from app.utils.logging import get_logger

logger = get_logger("sources")


class SourceService:
    """Persistence operations for sources."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create_text_source(self, payload: SourceCreateText, source_type: SourceType) -> Source:
        """Create a text or URL source from validated input."""
        if source_type not in (SourceType.TEXT, SourceType.URL):
            raise ValueError(f"create_text_source does not support {source_type}")

        source = Source(
            source_type=source_type,
            title=payload.title,
            text_content=payload.text_content if source_type is SourceType.TEXT else None,
            source_url=payload.text_content if source_type is SourceType.URL else None,
            language=payload.language,
        )
        self.db.add(source)
        self.db.commit()
        self.db.refresh(source)
        logger.info("source_created id=%s type=%s title_len=%s", source.id, source_type.value, len(payload.title))
        return source

    def get(self, source_id: int) -> Source:
        source = self.db.get(Source, source_id)
        if source is None:
            raise NotFoundError(f"Source {source_id} not found")
        return source

    def create_document_source(self, payload: bytes, filename: str, title: str | None, language: str | None) -> Source:
        """Process an uploaded document and persist it as a DOCUMENT source.

        Pipeline: validate extension/size → extract text → save original →
        persist source. Raises ValidationError (unsupported type/size),
        ExtractionError (unparseable/no text) and maps them to HTTP errors
        in the API layer.
        """
        storage = FileStorageService()
        extension = storage.validate_extension(filename)
        storage.validate_size(len(payload))

        result = DocumentProcessor().process(payload, filename)
        if not result.text_content:
            raise ExtractionError("Document contains no extractable text")

        file_path = storage.save(payload, filename)
        metadata = dict(result.metadata)
        if result.warnings:
            metadata["warnings"] = result.warnings

        source = Source(
            source_type=SourceType.DOCUMENT,
            title=title or Path(filename).stem or filename,
            original_filename=filename,
            mime_type=result.mime_type or mime_type_for(filename),
            text_content=result.text_content,
            file_path=file_path,
            language=language,
            processor_metadata=metadata,
        )
        self.db.add(source)
        self.db.commit()
        self.db.refresh(source)
        logger.info(
            "document_source_created id=%s file=%s words=%s",
            source.id,
            file_path,
            metadata.get("word_count", "?"),
        )
        return source

    def list(self, source_type: SourceType | None = None, limit: int = 50, offset: int = 0) -> tuple[list[Source], int]:
        """List sources with optional type filter and total count."""
        stmt = select(Source).order_by(Source.created_at.desc())
        if source_type is not None:
            stmt = stmt.where(Source.source_type == source_type)

        rows = self.db.scalars(stmt.limit(limit).offset(offset)).all()
        count_stmt = select(Source.id)
        if source_type is not None:
            count_stmt = count_stmt.where(Source.source_type == source_type)
        total = len(self.db.scalars(count_stmt).all())
        return list(rows), total
