"""Backend test package.

Safety net for environments without a backend/.env (e.g. CI): only provide
DATABASE_URL defaults when no .env file exists, because process environment
variables take precedence over the .env file in pydantic-settings.
"""

import os
from pathlib import Path

if not Path(".env").exists():
    os.environ.setdefault(
        "DATABASE_URL", "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/transform_x"
    )
    os.environ.setdefault(
        "TEST_DATABASE_URL", "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/transform_x_test"
    )
