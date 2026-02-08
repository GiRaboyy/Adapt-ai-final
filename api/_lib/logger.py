"""
Structured logging utilities for FastAPI application.
Provides consistent logging format and safe token redaction.
"""
import logging
import sys
from typing import Optional

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for the given module name.

    Args:
        name: Module name (usually __name__)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


def redact_token(token: Optional[str], show_chars: int = 8) -> str:
    """
    Safely redact JWT token for logging.
    Shows only first few characters.

    Args:
        token: JWT token string
        show_chars: Number of characters to show (default: 8)

    Returns:
        Redacted token string like "eyJhbGc***"

    Example:
        >>> redact_token("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature")
        "eyJhbGc***"
    """
    if not token:
        return "<empty>"

    if len(token) <= show_chars:
        return "***"

    return f"{token[:show_chars]}***"
