from typing import Annotated, Any

from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token, verify_token_type


async def get_current_user(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    if authorization is None:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")

        payload = decode_token(token)
        verify_token_type(payload, "access")

        return payload
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(role: str):
    async def role_dependency(
        current_user: dict[str, Any] = Depends(get_current_user),
    ) -> dict[str, Any]:
        user_role = current_user.get("role")
        if user_role != role:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{role}' is required. Current role: '{user_role}'",
            )
        return current_user

    return role_dependency


def require_any_role(roles: list[str]):
    async def roles_dependency(
        current_user: dict[str, Any] = Depends(get_current_user),
    ) -> dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"One of {roles} is required. Current role: '{user_role}'",
            )
        return current_user

    return roles_dependency


DatabaseDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[dict[str, Any], Depends(get_current_user)]
