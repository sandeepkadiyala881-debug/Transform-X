"""Source endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain import SourceType
from app.schemas.common import Envelope, EnvelopeList
from app.schemas.source import SourceCreateText, SourceResponse
from app.services.source_service import SourceService
from app.utils.errors import ValidationError

router = APIRouter(prefix="/sources", tags=["Sources"])


@router.post(
    "/text",
    response_model=Envelope[SourceResponse],
    status_code=201,
    summary="Create a text source",
    description="Creates a source from pasted text content.",
)
def create_text_source(
    payload: SourceCreateText,
    db: Session = Depends(get_db),
) -> Envelope[SourceResponse]:
    source = SourceService(db).create_text_source(payload, SourceType.TEXT)
    return Envelope(data=SourceResponse.model_validate(source), message="Text source created successfully")


@router.post(
    "/url",
    response_model=Envelope[SourceResponse],
    status_code=201,
    summary="Create a URL source",
    description="Registers an article/webpage URL for future processing.",
)
def create_url_source(
    payload: SourceCreateText,
    db: Session = Depends(get_db),
) -> Envelope[SourceResponse]:
    source = SourceService(db).create_text_source(payload, SourceType.URL)
    return Envelope(data=SourceResponse.model_validate(source), message="URL source registered successfully")


@router.get(
    "",
    response_model=EnvelopeList[SourceResponse],
    summary="List sources",
    description="Lists sources newest-first with optional type filter.",
)
def list_sources(
    source_type: SourceType | None = Query(None, description="Filter by source type"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> EnvelopeList[SourceResponse]:
    rows, total = SourceService(db).list(source_type=source_type, limit=limit, offset=offset)
    return EnvelopeList(data=[SourceResponse.model_validate(r) for r in rows], total=total)


@router.get(
    "/{source_id}",
    response_model=Envelope[SourceResponse],
    summary="Retrieve a source",
    description="Returns full metadata and text content for one source.",
)
def get_source(
    source_id: int,
    db: Session = Depends(get_db),
) -> Envelope[SourceResponse]:
    source = SourceService(db).get(source_id)
    return Envelope(data=SourceResponse.model_validate(source))
