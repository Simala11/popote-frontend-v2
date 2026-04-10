from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.routers import auth, listings, enquiries, submissions, stats


def seed_admin():
    from app.models.admin import Admin
    from app.core.security import hash_password

    db = SessionLocal()
    try:
        email = settings.ADMIN_EMAIL
        password = settings.ADMIN_PASSWORD[:72]
        exists = db.query(Admin).filter(Admin.email == email).first()
        if not exists:
            admin = Admin(
                email=email,
                hashed_password=hash_password(password),
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"✅  Admin seeded: {email}")
        else:
            print(f"ℹ️   Admin already exists: {email}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.models.admin import Admin
    Base.metadata.create_all(bind=engine)
    print(f"✅  {settings.APP_NAME} v{settings.VERSION} — tables ready")
    seed_admin()
    yield
    print("👋  Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="""
## Popote Listings API

Backend for **Popote Listings** — Kenya's premium property marketplace.

### Features
- 🏠 **Listings** — CRUD with Cloudinary image uploads
- 📩 **Enquiries** — public submission + admin inbox
- 📋 **Submissions** — "List With Us" form storage
- 🔐 **Auth** — JWT-protected admin routes
- ☁️  **Cloudinary** — auto-optimised image storage

### Auth
Use `POST /api/auth/login` to get a Bearer token, then click **Authorize** above.
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        *settings.cors_origins_list,  # keeps your existing production origins
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api"
app.include_router(auth.router,        prefix=PREFIX)
app.include_router(listings.router,    prefix=PREFIX)
app.include_router(enquiries.router,   prefix=PREFIX)
app.include_router(submissions.router, prefix=PREFIX)
app.include_router(stats.router,       prefix=PREFIX)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}