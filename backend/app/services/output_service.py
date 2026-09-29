"""Output service — storage and retrieval for generated deliverables."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain import OutputStatus, OutputType
from app.models import Output, Transformation
from app.schemas.output import OutputCreate
from app.utils.errors import NotFoundError, ValidationError
from app.utils.logging import get_logger

logger = get_logger("outputs")


class OutputService:
    """Persistence operations for outputs."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, payload: OutputCreate) -> Output:
        """Create an output record (storage only in Phase 2)."""
        transformation = self.db.get(Transformation, payload.transformation_id)
        if transformation is None:
            raise NotFoundError(f"Transformation {payload.transformation_id} not found")

        output = Output(
            transformation_id=payload.transformation_id,
            output_type=payload.output_type,
            status=payload.status,
            title=payload.title,
            content=payload.content,
        )
        self.db.add(output)
        self.db.commit()
        self.db.refresh(output)
        logger.info("output_created id=%s type=%s", output.id, output.output_type.value)
        return output

    def get(self, output_id: int) -> Output:
        output = self.db.get(Output, output_id)
        if output is None:
            raise NotFoundError(f"Output {output_id} not found")
        return output

    def list(
        self,
        transformation_id: int | None = None,
        output_type: OutputType | None = None,
        status: OutputStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Output], int]:
        """List outputs newest-first with optional filters and total count."""
        stmt = select(Output).order_by(Output.created_at.desc())
        count_stmt = select(func.count()).select_from(Output)
        if transformation_id is not None:
            stmt = stmt.where(Output.transformation_id == transformation_id)
            count_stmt = count_stmt.where(Output.transformation_id == transformation_id)
        if output_type is not None:
            stmt = stmt.where(Output.output_type == output_type)
            count_stmt = count_stmt.where(Output.output_type == output_type)
        if status is not None:
            stmt = stmt.where(Output.status == status)
            count_stmt = count_stmt.where(Output.status == status)

        rows = self.db.scalars(stmt.limit(limit).offset(offset)).all()
        total = self.db.scalar(count_stmt) or 0
        return list(rows), int(total)


# Re-exported for the API layer's query-parameter validation.
VALID_OUTPUT_TYPES = [t.value for t in OutputType]
VALID_OUTPUT_STATUSES = [s.value for s in OutputStatus]
