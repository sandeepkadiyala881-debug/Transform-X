"""Output request/response schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domain import OutputStatus, OutputType


class OutputCreate(BaseModel):
    """Request body for POST /outputs (storage-only in Phase 2)."""

    transformation_id: int
    output_type: OutputType
    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = None
    status: OutputStatus = OutputStatus.PENDING


class OutputResponse(BaseModel):
    """Public shape of a generated deliverable record."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    transformation_id: int
    output_type: OutputType
    status: OutputStatus
    title: str
    content: Optional[str] = None
    created_at: datetime
    updated_at: datetime
