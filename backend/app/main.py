"""Compatibility entry point.

Run the project from its root with:
    uvicorn backend.main:app --reload
"""

from backend.main import app

__all__ = ["app"]
