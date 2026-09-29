"""Structured application logging.

Logs application startup/shutdown, request errors and service failures.
Never log credentials, API keys or database connection strings.
"""

import logging
import sys

_CONFIGURED = False


def configure_logging(level: str = "INFO") -> None:
    """Configure root logging once with a compact structured format."""
    global _CONFIGURED
    if _CONFIGURED:
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )

    root = logging.getLogger()
    root.setLevel(level.upper())
    root.addHandler(handler)

    # Align third-party loggers with the app level.
    for noisy in ("uvicorn.access", "sqlalchemy.engine"):
        logging.getLogger(noisy).setLevel("WARNING")

    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Namespaced logger for services and API modules."""
    return logging.getLogger(f"transformx.{name}")
