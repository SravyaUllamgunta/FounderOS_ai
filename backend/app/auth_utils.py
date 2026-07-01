"""Compatibility exports for the canonical authentication service."""

from backend.services.auth_service import AuthService, get_current_user

verify_password = AuthService.verify_password
get_password_hash = AuthService.get_password_hash
create_access_token = AuthService.create_access_token

__all__ = [
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "get_current_user",
]
