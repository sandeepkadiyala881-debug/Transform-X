"""Transformation endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain import TransformationStatus
from app.schemas.common import Envelope, EnvelopeList
from app.schemas.transformation import TransformationCreate, TransformationResponse, TransformationUpdate
from app.services.transformation_service import TransformationService

router = APIRouter(prefix="/transformations", tags=["Transformations"])


@router.post(
    "",
    response_model=Envelope[TransformationResponse],
    status_code=201,
    summary="Create transformation session",
    description="Creates a transformation with its configuration and PENDING outputs in one transaction.",
)
def create_transformation(
    payload: TransformationCreate,
    db: Session = Depends(get_db),
) -> Envelope[TransformationResponse]:
    transformation = TransformationService(db).create(payload)
    return Envelope(data=TransformationResponse.model_validate(transformation), message="Transformation created successfully")


@router.get(
    "",
    response_model=EnvelopeList[TransformationResponse],
    summary="List transformations",
    description="Lists transformation sessions newest-first with optional status filter.",
)
def list_transformations(
    status: TransformationStatus | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> EnvelopeList[TransformationResponse]:
    rows, total = TransformationService(db).list(status=status, limit=limit, offset=offset)
    return EnvelopeList(data=[TransformationResponse.model_validate(r) for r in rows], total=total)


@router.get(
    "/{transformation_id}",
    response_model=Envelope[TransformationResponse],
    summary="Retrieve transformation",
    description="Returns one transformation with configuration and outputs.",
)
def get_transformation(
    transformation_id: int,
    db: Session = Depends(get_db),
) -> Envelope[TransformationResponse]:
    transformation = TransformationService(db).get(transformation_id)
    return Envelope(data=TransformationResponse.model_validate(transformation))


@router.patch(
    "/{transformation_id}",
    response_model=Envelope[TransformationResponse],
    summary="Update transformation",
    description="Updates title and/or status with validated state transitions.",
)
def update_transformation(
    transformation_id: int,
    payload: TransformationUpdate,
    db: Session = Depends(get_db),
) -> Envelope[TransformationResponse]:
    transformation = TransformationService(db).update(transformation_id, payload)
    return Envelope(data=TransformationResponse.model_validate(transformation), message="Transformation updated successfully")
