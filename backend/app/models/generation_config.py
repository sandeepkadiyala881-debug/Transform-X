"""GenerationConfiguration model — how the operator wants content transformed."""

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.domain import CommunicationObjective, ContentStyle, DetailLevel, Language, TargetAudience, Tone


class GenerationConfiguration(TimestampMixin, Base):
    """Operator-chosen knobs applied to every deliverable of a transformation."""

    __tablename__ = "generation_configurations"

    id: Mapped[int] = mapped_column(primary_key=True)
    transformation_id: Mapped[int] = mapped_column(
        ForeignKey("transformations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    target_audience: Mapped[TargetAudience] = mapped_column(
        SAEnum(TargetAudience, name="target_audience", native_enum=False, length=64), nullable=False
    )
    tone: Mapped[Tone] = mapped_column(SAEnum(Tone, name="tone", native_enum=False, length=32), nullable=False)
    language: Mapped[Language] = mapped_column(
        SAEnum(Language, name="language", native_enum=False, length=32), nullable=False
    )
    detail_level: Mapped[DetailLevel] = mapped_column(
        SAEnum(DetailLevel, name="detail_level", native_enum=False, length=32), nullable=False
    )
    communication_objective: Mapped[CommunicationObjective] = mapped_column(
        SAEnum(CommunicationObjective, name="communication_objective", native_enum=False, length=32),
        nullable=False,
    )
    content_style: Mapped[ContentStyle] = mapped_column(
        SAEnum(ContentStyle, name="content_style", native_enum=False, length=32), nullable=False
    )

    transformation: Mapped["Transformation"] = relationship(back_populates="configuration")  # noqa: F821
