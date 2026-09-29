"""File storage — persists original uploads under UPLOAD_DIR/yyyy/mm/.

Paths stored in the database are relative to UPLOAD_DIR so the storage root
can move between environments without a data migration.
"""

import uuid
from datetime import UTC, datetime
from pathlib import Path

from app.config import get_settings
from app.utils.errors import PayloadTooLargeError, UnsupportedTypeError
from app.utils.logging import get_logger

logger = get_logger("storage")


class FileStorageService:
    """Saves upload payloads to the configured storage directory."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.root = Path(self.settings.upload_dir)

    def extension_of(self, filename: str) -> str:
        """Lowercase extension without the dot ('' if none)."""
        return Path(filename).suffix.lower().lstrip(".")

    def validate_extension(self, filename: str) -> str:
        """Return the validated extension or raise UnsupportedTypeError (415)."""
        extension = self.extension_of(filename)
        if not extension:
            raise UnsupportedTypeError("Uploaded file has no extension")
        if extension not in self.settings.allowed_document_extension_list:
            raise UnsupportedTypeError(
                f"Unsupported file type '.{extension}'",
                details={"allowed": self.settings.allowed_document_extension_list},
            )
        return extension

    def validate_size(self, size_bytes: int) -> None:
        """Reject payloads above MAX_UPLOAD_SIZE_MB (413)."""
        limit = self.settings.max_upload_size_bytes
        if size_bytes > limit:
            raise PayloadTooLargeError(
                f"File exceeds the maximum upload size of {self.settings.max_upload_size_mb} MB",
                details={"size_bytes": size_bytes, "limit_bytes": limit},
            )

    def save(self, payload: bytes, filename: str) -> str:
        """Persist bytes and return the relative path (forward slashes).

        Layout: <UPLOAD_DIR>/<yyyy>/<mm>/<uuid8>.<ext>
        """
        extension = self.validate_extension(filename)
        now = datetime.now(UTC)
        target_dir = self.root / f"{now.year:04d}" / f"{now.month:02d}"
        target_dir.mkdir(parents=True, exist_ok=True)

        target = target_dir / f"{uuid.uuid4().hex[:8]}.{extension}"
        target.write_bytes(payload)

        relative = target.relative_to(self.root).as_posix()
        logger.info("file_saved path=%s bytes=%s", relative, len(payload))
        return relative

    def absolute_path(self, relative_path: str) -> Path:
        """Resolve a stored relative path; used by the future download endpoint."""
        return self.root / relative_path
