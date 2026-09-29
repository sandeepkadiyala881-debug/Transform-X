"""Consistent API error types mapped to HTTP responses in main.py."""

from typing import Any


class AppError(Exception):
    """Base class for expected application errors."""

    status_code = 500
    error = "internal_error"

    def __init__(self, message: str, details: Any | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details


class NotFoundError(AppError):
    """Requested resource does not exist (HTTP 404)."""

    status_code = 404
    error = "not_found"


class ValidationError(AppError):
    """Semantically invalid request that passes schema validation (HTTP 400)."""

    status_code = 400
    error = "invalid_request"


class PayloadTooLargeError(AppError):
    """Upload exceeds the configured size limit (HTTP 413)."""

    status_code = 413
    error = "payload_too_large"


class UnsupportedTypeError(AppError):
    """Upload type/extension is outside the allowlist (HTTP 415)."""

    status_code = 415
    error = "unsupported_media_type"


class UnprocessableContentError(AppError):
    """Payload parsed but contains no usable content (HTTP 422)."""

    status_code = 422
    error = "unprocessable_content"
