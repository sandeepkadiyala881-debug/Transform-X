"""Source endpoints."""

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain import SourceType
from app.processors.base import ExtractionError
from app.schemas.common import Envelope, EnvelopeList
from app.schemas.source import SourceCreateText, SourceResponse
from app.services.source_service import SourceService
from app.utils.errors import UnprocessableContentError, ValidationError
from app.utils.logging import get_logger

logger = get_logger("api.sources")

router = APIRouter(prefix="/sources", tags=["Sources"])


@router.post(
    "/documents",
    response_model=Envelope[SourceResponse],
    status_code=201,
    summary="Upload a document source",
    description=(
        "Accepts a PDF, DOCX or TXT upload, extracts its text content, stores "
        "the original file and creates a DOCUMENT source. OCR is not performed "
        "in this phase; scanned documents are rejected."
    ),
)
async def create_document_source(
    file: UploadFile = File(..., description="Document file (PDF, DOCX or TXT)"),
    title: str | None = Form(None, description="Optional display title; derived from filename when omitted"),
    language: str | None = Form(None, description="Optional language hint"),
    db: Session = Depends(get_db),
) -> Envelope[SourceResponse]:
    payload = await file.read()
    filename = Path(file.filename or "upload").name  # strip any client path
    try:
        source = SourceService(db).create_document_source(
            payload=payload, filename=filename, title=title, language=language
        )
    except ExtractionError as exc:
        # No extractable text (e.g. scanned PDF) — HTTP 422 with clear guidance.
        raise UnprocessableContentError(str(exc), details={"filename": filename}) from exc
    return Envelope(data=SourceResponse.model_validate(source), message="Document source created successfully")


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
