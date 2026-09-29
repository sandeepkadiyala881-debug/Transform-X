"""Output endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain import OutputStatus, OutputType
from app.schemas.common import Envelope, EnvelopeList
from app.schemas.output import OutputCreate, OutputResponse
from app.services.output_service import OutputService

router = APIRouter(prefix="/outputs", tags=["Outputs"])


@router.post(
    "",
    response_model=Envelope[OutputResponse],
    status_code=201,
    summary="Create output record",
    description="Stores an output record for a transformation (no AI generation in Phase 2).",
)
def create_output(
    payload: OutputCreate,
    db: Session = Depends(get_db),
) -> Envelope[OutputResponse]:
    output = OutputService(db).create(payload)
    return Envelope(data=OutputResponse.model_validate(output), message="Output created successfully")


@router.get(
    "",
    response_model=EnvelopeList[OutputResponse],
    summary="List outputs",
    description="Lists outputs newest-first with optional transformation/type/status filters.",
)
def list_outputs(
    transformation_id: int | None = Query(None),
    output_type: OutputType | None = Query(None),
    status: OutputStatus | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> EnvelopeList[OutputResponse]:
    rows, total = OutputService(db).list(
        transformation_id=transformation_id, output_type=output_type, status=status, limit=limit, offset=offset
    )
    return EnvelopeList(data=[OutputResponse.model_validate(r) for r in rows], total=total)


@router.get(
    "/{output_id}",
    response_model=Envelope[OutputResponse],
    summary="Retrieve output",
    description="Returns one generated deliverable record.",
)
def get_output(
    output_id: int,
    db: Session = Depends(get_db),
) -> Envelope[OutputResponse]:
    output = OutputService(db).get(output_id)
    return Envelope(data=OutputResponse.model_validate(output))
