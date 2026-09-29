"""Transformation service — business logic for transformation sessions."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain import OutputStatus, OutputType, TransformationStatus
from app.models import GenerationConfiguration, Output, Source, Transformation
from app.schemas.transformation import TransformationCreate, TransformationUpdate
from app.utils.errors import NotFoundError, ValidationError
from app.utils.logging import get_logger

logger = get_logger("transformations")

ALLOWED_STATUS_TRANSITIONS: dict[TransformationStatus, set[TransformationStatus]] = {
    TransformationStatus.DRAFT: {
        TransformationStatus.READY,
        TransformationStatus.PROCESSING,
        TransformationStatus.FAILED,
    },
    TransformationStatus.READY: {TransformationStatus.PROCESSING, TransformationStatus.FAILED, TransformationStatus.DRAFT},
    TransformationStatus.PROCESSING: {TransformationStatus.COMPLETED, TransformationStatus.FAILED},
    TransformationStatus.COMPLETED: set(),
    TransformationStatus.FAILED: {TransformationStatus.READY, TransformationStatus.PROCESSING},
}


class TransformationService:
    """Persistence operations for transformation sessions."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, payload: TransformationCreate) -> Transformation:
        """Create a transformation, its configuration and PENDING outputs.

        Everything is written in a single transaction; any failure rolls the
        whole session back.
        """
        source = self.db.get(Source, payload.source_id)
        if source is None:
            raise NotFoundError(f"Source {payload.source_id} not found")

        transformation = Transformation(
            title=payload.title,
            status=TransformationStatus.READY,
            source_id=payload.source_id,
            configuration=GenerationConfiguration(
                target_audience=payload.configuration.target_audience,
                tone=payload.configuration.tone,
                language=payload.configuration.language,
                detail_level=payload.configuration.detail_level,
                communication_objective=payload.configuration.communication_objective,
                content_style=payload.configuration.content_style,
            ),
            outputs=[
                Output(
                    output_type=OutputType(output_type),
                    status=OutputStatus.PENDING,
                    title=output_type.replace("_", " ").title(),
                    content=None,
                )
                for output_type in payload.output_types
            ],
        )
        self.db.add(transformation)
        self.db.commit()
        self.db.refresh(transformation)
        logger.info("transformation_created id=%s outputs=%s", transformation.id, len(transformation.outputs))
        return transformation

    def get(self, transformation_id: int) -> Transformation:
        transformation = self.db.get(Transformation, transformation_id)
        if transformation is None:
            raise NotFoundError(f"Transformation {transformation_id} not found")
        return transformation

    def list(
        self, status: TransformationStatus | None = None, limit: int = 50, offset: int = 0
    ) -> tuple[list[Transformation], int]:
        """List transformations newest-first with optional status filter."""
        stmt = select(Transformation).order_by(Transformation.created_at.desc())
        count_stmt = select(func.count()).select_from(Transformation)
        if status is not None:
            stmt = stmt.where(Transformation.status == status)
            count_stmt = count_stmt.where(Transformation.status == status)

        rows = self.db.scalars(stmt.limit(limit).offset(offset)).all()
        total = self.db.scalar(count_stmt) or 0
        return list(rows), int(total)

    def update(self, transformation_id: int, payload: TransformationUpdate) -> Transformation:
        """Update title and/or status with transition validation."""
        transformation = self.get(transformation_id)

        if payload.status is not None and payload.status != transformation.status:
            current = transformation.status
            allowed = ALLOWED_STATUS_TRANSITIONS.get(current, set())
            if payload.status not in allowed:
                raise ValidationError(
                    f"Invalid status transition {current.value} -> {payload.status.value}",
                    details={"current": current.value, "attempted": payload.status.value},
                )
            transformation.status = payload.status

        if payload.title is not None:
            transformation.title = payload.title

        self.db.commit()
        self.db.refresh(transformation)
        logger.info("transformation_updated id=%s status=%s", transformation.id, transformation.status.value)
        return transformation
