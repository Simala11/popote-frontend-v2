from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.admin import Admin


def seed_admin(db: Session) -> None:
    email = settings.ADMIN_EMAIL
    password = settings.ADMIN_PASSWORD

    # bcrypt limit is 72 bytes — truncate to be safe
    password_bytes = password.encode("utf-8")[:72].decode("utf-8", errors="ignore")

    exists = db.query(Admin).filter(Admin.email == email).first()
    if not exists:
        admin = Admin(
            email=email,
            hashed_password=hash_password(password_bytes),
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"[seed] Admin created: {email}")
    else:
        print(f"[seed] Admin already exists: {email}")