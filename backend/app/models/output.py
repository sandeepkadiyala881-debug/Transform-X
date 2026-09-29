"""Output model — a generated deliverable (storage only in Phase 2)."""

from typing import Optional

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.domain import OutputStatus, OutputType


class Output(TimestampMixin, Base):
    """One deliverable belonging to a transformation.

    Phase 2 stores output records; the AI generation that fills ``content``
    arrives in Phase 5.
    """

    __tablename__ = "outputs"

    id: Mapped[int] = mapped_column(primary_key=True)
    transformation_id: Mapped[int] = mapped_column(
        ForeignKey("transformations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    output_type: Mapped[OutputType] = mapped_column(
        SAEnum(OutputType, name="output_type", native_enum=False, length=64), nullable=False
    )
    status: Mapped[OutputStatus] = mapped_column(
        SAEnum(OutputStatus, name="output_status", native_enum=False, length=32),
        nullable=False,
        default=OutputStatus.PENDING,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    transformation: Mapped["Transformation"] = relationship(back_populates="outputs")  # noqa: F821
