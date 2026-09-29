"""Shared response envelope schemas.

``Envelope`` wraps single-resource responses; ``EnvelopeList`` wraps list
endpoints with a total count. FastAPI validation errors (422) keep their
native shape for frontend convenience.
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Envelope(BaseModel, Generic[T]):
    """Single-resource envelope: ``{"data": ..., "message": ...}``."""

    data: T
    message: str | None = None


class EnvelopeList(BaseModel, Generic[T]):
    """List envelope: ``{"data": [...], "total": n}``."""

    data: list[T]
    total: int
