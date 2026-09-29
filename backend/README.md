# TRANSFORM-X — Backend (Phase 2 + 3A)

FastAPI + PostgreSQL foundation plus **text & document processing** for the
TRANSFORM-X AI-powered content transformation platform (SIH 2026 • PS 26154).

**Phase 2:** receives and stores transformation sessions with their sources,
generation configurations and output records.

**Phase 3A:** uploads PDF/DOCX/TXT documents, extracts their text (pypdf,
python-docx, charset-normalizer), stores the original file under `uploads/`
and persists extraction metadata on the source.

```
Frontend  →  FastAPI REST API  →  PostgreSQL
```

**What this phase intentionally does NOT do:** AI generation, OCR,
speech-to-text, video understanding, PDF/DOCX parsing, URL scraping,
authentication. Those arrive in later phases — the `app/processors/` and
`app/ai/` packages mark those boundaries.

---

## Requirements

- Python 3.14+
- PostgreSQL 14+ (tested with PostgreSQL 18.6)
- The Phase-1 frontend lives in the repository root (`npm run dev` on port 5173)

## Python environment setup

```bash
cd backend

# Create the virtual environment (never install globally)
py -3.14 -m venv .venv

# Activate it
# Windows (Git Bash / PowerShell):
.venv\Scripts\activate
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Installed packages: FastAPI, Uvicorn, SQLAlchemy 2.x, Pydantic,
pydantic-settings, psycopg 3 (PostgreSQL driver), Alembic, plus Phase-3A
document processing (python-multipart, pypdf, python-docx,
charset-normalizer) and pytest/httpx. No OCR or AI libraries yet.

## PostgreSQL setup

Create the development and test databases (psql example):

```sql
CREATE DATABASE transform_x;
CREATE DATABASE transform_x_test;
```

## Environment variables

Copy the template and fill in real values — **never commit `.env`**:

```bash
cp .env.example .env
```

| Variable            | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `DATABASE_URL`      | `postgresql+psycopg://user:pass@host:5432/transform_x` |
| `TEST_DATABASE_URL` | Same, pointing at `transform_x_test`             |
| `ENVIRONMENT`       | `development` \| `staging` \| `production`       |
| `API_V1_PREFIX`     | Default `/api/v1`                                |
| `CORS_ORIGINS`      | Comma-separated origins, e.g. `http://localhost:5173` |
| `LOG_LEVEL`         | `DEBUG` \| `INFO` \| `WARNING` \| `ERROR`        |
| `UPLOAD_DIR`        | Where original uploads are stored (default `uploads`) |
| `MAX_UPLOAD_SIZE_MB`| Upload size cap (default `25`)                   |
| `ALLOWED_DOCUMENT_EXTENSIONS` | Upload allowlist (default `pdf,docx,txt`) |

> Tip: percent-encode special characters in the password inside the URL
> (e.g. `@` → `%40`).

## Database migration

```bash
# Apply all migrations (creates sources, transformations,
# generation_configurations, outputs)
alembic upgrade head

# Generate a new migration after model changes
alembic revision --autogenerate -m "describe the change"
```

## Running FastAPI

```bash
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: **http://localhost:8000/docs**
- ReDoc: **http://localhost:8000/redoc**
- Health: `GET /api/v1/health` and `GET /api/v1/health/db`

## API surface (Phase 2)

| Method | Path                              | Purpose                              |
| ------ | --------------------------------- | ------------------------------------ |
| GET    | `/api/v1/health`                  | Service liveness                     |
| GET    | `/api/v1/health/db`               | PostgreSQL connectivity              |
| POST   | `/api/v1/sources/text`            | Create a text source                 |
| POST   | `/api/v1/sources/documents`       | Upload PDF/DOCX/TXT, extract text, store file |
| POST   | `/api/v1/sources/url`             | Register a URL source                |
| GET    | `/api/v1/sources`                 | List sources (filter by type)        |
| GET    | `/api/v1/sources/{id}`            | Retrieve one source                  |
| POST   | `/api/v1/transformations`         | Create session + config + PENDING outputs |
| GET    | `/api/v1/transformations`         | List sessions (filter by status)     |
| GET    | `/api/v1/transformations/{id}`    | Retrieve one session                 |
| PATCH  | `/api/v1/transformations/{id}`    | Update title / status (validated transitions) |
| POST   | `/api/v1/outputs`                 | Store an output record               |
| GET    | `/api/v1/outputs`                 | List outputs (filters)               |
| GET    | `/api/v1/outputs/{id}`            | Retrieve one output                  |

Responses use a consistent envelope — single resources:
`{"data": {...}, "message": "..."}`, lists: `{"data": [...], "total": n}`,
errors: `{"error": "...", "message": "...", "details": ...}`.
Validation failures keep FastAPI's native 422 shape.

Document upload error codes: **413** `payload_too_large`, **415**
`unsupported_media_type`, **422** `unprocessable_content` (includes scanned
PDFs with no extractable text — OCR arrives in Phase 4).

## Testing

```bash
pytest tests/
```

Tests run against the isolated `transform_x_test` database with
savepoint-scoped transactions (rolled back per test), so the development
database is never touched and tests never leak data into each other.
Coverage includes: health, DB connectivity, source CRUD, transformation
CRUD + status-transition validation, output seeding/retrieval, and error
shapes (404 / 400 / 422).

## Architecture

```
backend/
├── app/
│   ├── main.py               # FastAPI app: CORS, error handlers, routers
│   ├── config.py             # pydantic-settings (env-driven, no secrets in code)
│   ├── domain.py             # Shared enums (SourceType, statuses, config knobs)
│   ├── api/v1/               # Thin route handlers
│   ├── db/                   # Engine, session factory, declarative base
│   ├── models/               # SQLAlchemy 2.x models (Source, Transformation,
│   │                         #   GenerationConfiguration, Output)
│   ├── schemas/              # Pydantic request/response models
│   ├── services/             # Business logic (routes stay thin)
│   ├── utils/                # Logging + typed errors
│   ├── processors/           # Phase-3 boundary: document/image/video/url processors
│   └── ai/                   # Phase-4/5 boundary: source analyzer, transformation engine
├── alembic/                  # Migrations (initial schema reproducible)
├── tests/                    # pytest suite on an isolated test database
├── requirements.txt
├── .env.example
└── README.md
```

## Roadmap (later phases)

- **Phase 3** — input processing: file uploads, PDF/DOCX/image/video/URL
  processors behind `app/processors/`
- **Phase 4** — source intelligence: `app/ai/source_analyzer`
- **Phase 5** — AI transformation engine producing real deliverables
- **Later** — authentication, advanced analytics
