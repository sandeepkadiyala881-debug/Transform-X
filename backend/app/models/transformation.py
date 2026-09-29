"""Transformation model — one transformation session."""

from typing import Optional

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.domain import TransformationStatus


class Transformation(TimestampMixin, Base):
    """One transformation session tying a Source to its configuration and outputs."""

    __tablename__ = "transformations"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[TransformationStatus] = mapped_column(
        SAEnum(TransformationStatus, name="transformation_status", native_enum=False, length=32),
        nullable=False,
        default=TransformationStatus.DRAFT,
    )
    source_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("sources.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Transformation 1-1 Configuration (set once; Phase 2 keeps it simple)
    configuration: Mapped[Optional["GenerationConfiguration"]] = relationship(  # noqa: F821
        back_populates="transformation",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    # Transformation 1-N Outputs
    outputs: Mapped[list["Output"]] = relationship(  # noqa: F821
        back_populates="transformation",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
