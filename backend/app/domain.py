"""Centralised domain enumerations shared by models, schemas and services.

Values are uppercase strings stored directly in PostgreSQL columns, keeping
the database human-readable and matching the TRANSFORM-X product vocabulary.
"""

from enum import Enum


class SourceType(str, Enum):
    """Kind of information supplied by the operator."""

    TEXT = "TEXT"
    DOCUMENT = "DOCUMENT"
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    URL = "URL"


class TransformationStatus(str, Enum):
    """Lifecycle of one transformation session."""

    DRAFT = "DRAFT"
    READY = "READY"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class OutputType(str, Enum):
    """Deliverable kinds the platform will generate in later phases."""

    ADVISORY = "ADVISORY"
    EXECUTIVE_SUMMARY = "EXECUTIVE_SUMMARY"
    LINKEDIN = "LINKEDIN"
    X_POST = "X_POST"
    PRESENTATION = "PRESENTATION"
    INFOGRAPHIC = "INFOGRAPHIC"
    VIDEO_PACKAGE = "VIDEO_PACKAGE"


class OutputStatus(str, Enum):
    """Lifecycle of one generated deliverable."""

    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class TargetAudience(str, Enum):
    GENERAL_PUBLIC = "GENERAL_PUBLIC"
    TECHNICAL_TEAM = "TECHNICAL_TEAM"
    EXECUTIVES = "EXECUTIVES"
    GOVERNMENT_OFFICIALS = "GOVERNMENT_OFFICIALS"
    SECURITY_OFFICERS = "SECURITY_OFFICERS"


class Tone(str, Enum):
    PROFESSIONAL = "PROFESSIONAL"
    FORMAL = "FORMAL"
    TECHNICAL = "TECHNICAL"
    INFORMATIVE = "INFORMATIVE"
    URGENT = "URGENT"


class Language(str, Enum):
    ENGLISH = "ENGLISH"
    HINDI = "HINDI"
    TELUGU = "TELUGU"


class DetailLevel(str, Enum):
    BRIEF = "BRIEF"
    STANDARD = "STANDARD"
    DETAILED = "DETAILED"


class CommunicationObjective(str, Enum):
    INFORM = "INFORM"
    ALERT = "ALERT"
    EDUCATE = "EDUCATE"
    BRIEF = "BRIEF"
    PUBLISH = "PUBLISH"


class ContentStyle(str, Enum):
    REPORT = "REPORT"
    ADVISORY = "ADVISORY"
    CORPORATE = "CORPORATE"
    SOCIAL = "SOCIAL"
    PRESENTATION = "PRESENTATION"
