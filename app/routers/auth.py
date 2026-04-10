from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import verify_password, create_access_token, hash_password, get_current_admin
from app.core.database import get_db
from app.models.models import AdminConfig
from app.schemas.schemas import LoginRequest, TokenOut, ChangePasswordRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Helper: get or create the single AdminConfig row ─────────────────────────

def _get_or_create_config(db: Session) -> AdminConfig:
    """
    Returns the AdminConfig row (id=1), creating it from .env if it doesn't exist.
    This means the first deploy seeds the DB with the .env password automatically.
    """
    config = db.query(AdminConfig).filter(AdminConfig.id == 1).first()
    if not config:
        config = AdminConfig(
            id=1,
            password_hash=hash_password(settings.ADMIN_PASSWORD),
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenOut)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Admin login. Returns a JWT access token.
    Use this token as Bearer in the Authorization header for protected routes.
    """
    if body.username != settings.ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    config = _get_or_create_config(db)

    if not verify_password(body.password, config.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(data={"sub": body.username})
    return TokenOut(access_token=token)


# ── Me ────────────────────────────────────────────────────────────────────────

@router.get("/me")
def me(token_data: dict = Depends(get_current_admin)):
    """Quick health-check for the token — returns the admin username."""
    return {"username": token_data["sub"], "role": "admin"}


# ── Change Password ───────────────────────────────────────────────────────────

@router.post("/change-password", status_code=200)
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    """
    Change the admin password. Requires a valid Bearer token.
    Persists the new hashed password to the database — survives restarts.
    """
    config = _get_or_create_config(db)

    # 1. Verify current password
    if not verify_password(body.current_password, config.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )

    # 2. Basic validation
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must be at least 8 characters.",
        )

    # 3. Hash and persist to DB
    config.password_hash = hash_password(body.new_password)
    db.commit()

    return {"message": "Password updated successfully."}