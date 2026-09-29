"""Transformation request/response schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain import (
    CommunicationObjective,
    ContentStyle,
    DetailLevel,
    Language,
    TargetAudience,
    Tone,
    TransformationStatus,
)
from app.schemas.output import OutputResponse
from app.schemas.source import SourceSummary


class GenerationConfigurationPayload(BaseModel):
    """Configuration block sent inside transformation creation requests."""

    target_audience: TargetAudience
    tone: Tone
    language: Language
    detail_level: DetailLevel
    communication_objective: CommunicationObjective
    content_style: ContentStyle


class TransformationCreate(BaseModel):
    """Request body for POST /transformations."""

    title: str = Field(..., min_length=1, max_length=255)
    source_id: int
    configuration: GenerationConfigurationPayload
    # Output types the operator wants generated (stored as PENDING outputs).
    output_types: list[str] = Field(..., min_length=1)

    @field_validator("output_types")
    @classmethod
    def validate_output_types(cls, v: list[str]) -> list[str]:
        """Normalise to uppercase and reject unknown or duplicate types."""
        from app.domain import OutputType

        valid = {t.value for t in OutputType}
        normalized: list[str] = []
        for item in v:
            upper = item.strip().upper()
            if upper not in valid:
                raise ValueError(f"unknown output_type: {item}")
            if upper in normalized:
                raise ValueError(f"duplicate output_type: {item}")
            normalized.append(upper)
        return normalized


class TransformationUpdate(BaseModel):
    """Request body for PATCH /transformations/{id} — basic state changes."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[TransformationStatus] = None


class GenerationConfigurationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transformation_id: int
    target_audience: TargetAudience
    tone: Tone
    language: Language
    detail_level: DetailLevel
    communication_objective: CommunicationObjective
    content_style: ContentStyle
    created_at: datetime


class TransformationResponse(BaseModel):
    """Public shape of a transformation including its config and outputs."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: TransformationStatus
    source_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    configuration: Optional[GenerationConfigurationResponse] = None
    outputs: list[OutputResponse] = []
    source: Optional[SourceSummary] = None
