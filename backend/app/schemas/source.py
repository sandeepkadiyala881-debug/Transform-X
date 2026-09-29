"""Source request/response schemas."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain import SourceType


class SourceCreateText(BaseModel):
    """Request body for POST /sources/text."""

    title: str = Field(..., min_length=1, max_length=255)
    text_content: str = Field(..., min_length=1)
    language: Optional[str] = Field(None, max_length=32)

    @field_validator("text_content")
    @classmethod
    def content_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text_content must not be blank")
        return v


class SourceCreateFile(BaseModel):
    """Metadata payload for future file-based source creation (Phase 3).

    Phase 2 validates the shape; the endpoint arrives with real file upload
    handling in the input-processing phase.
    """

    title: str = Field(..., min_length=1, max_length=255)
    original_filename: str = Field(..., min_length=1, max_length=255)
    mime_type: str = Field(..., min_length=3, max_length=127)
    language: Optional[str] = Field(None, max_length=32)


class SourceResponse(BaseModel):
    """Public shape of a source. Large text content is truncated in lists."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    source_type: SourceType
    title: str
    original_filename: Optional[str] = None
    mime_type: Optional[str] = None
    text_content: Optional[str] = None
    source_url: Optional[str] = None
    file_path: Optional[str] = None
    language: Optional[str] = None
    processor_metadata: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class SourceSummary(BaseModel):
    """Compact source projection for embedding in transformation responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    source_type: SourceType
    title: str
    created_at: datetime
