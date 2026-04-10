from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean,
    DateTime, ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


# ── Enums ─────────────────────────────────────────────────────────────────────

class RegionEnum(str, enum.Enum):
    nairobi = "Nairobi"
    mombasa = "Mombasa"
    outskirts = "Nairobi Outskirts"
    other = "Other Kenya"


class CategoryEnum(str, enum.Enum):
    sale_ready = "For Sale · Ready"
    sale_offplan = "For Sale · Off-Plan"
    rental_furnished = "Rental · Furnished"
    rental_unfurnished = "Rental · Unfurnished"
    short_stay = "Short Stay / Airbnb"
    commercial = "Commercial"


class EnquiryStatusEnum(str, enum.Enum):
    new = "New"
    read = "Read"
    replied = "Replied"


# ── Listing ───────────────────────────────────────────────────────────────────

class Listing(Base):
    __tablename__ = "listings"

    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String(180), nullable=False, index=True)
    region        = Column(SAEnum(RegionEnum), nullable=False, index=True)
    location      = Column(String(120))
    category      = Column(SAEnum(CategoryEnum), nullable=False, index=True)
    price         = Column(Float, nullable=False)
    price_display = Column(String(60))
    beds          = Column(Integer)
    baths         = Column(Integer)
    sqm           = Column(Integer)
    description   = Column(Text)
    youtube_url   = Column(String(250))
    amenities     = Column(Text)
    is_active     = Column(Boolean, default=True, index=True)
    is_featured   = Column(Boolean, default=False)
    views         = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    images    = relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan", order_by="ListingImage.order")
    enquiries = relationship("Enquiry", back_populates="listing")


# ── Listing Image ─────────────────────────────────────────────────────────────

class ListingImage(Base):
    __tablename__ = "listing_images"

    id           = Column(Integer, primary_key=True, index=True)
    listing_id   = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    url          = Column(String(500), nullable=False)
    public_id    = Column(String(300), nullable=False)
    width        = Column(Integer)
    height       = Column(Integer)
    format       = Column(String(10))
    size_bytes   = Column(Integer)
    order        = Column(Integer, default=0)
    is_primary   = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    listing = relationship("Listing", back_populates="images")


# ── Enquiry ───────────────────────────────────────────────────────────────────

class Enquiry(Base):
    __tablename__ = "enquiries"

    id          = Column(Integer, primary_key=True, index=True)
    listing_id  = Column(Integer, ForeignKey("listings.id", ondelete="SET NULL"), nullable=True)
    name        = Column(String(120), nullable=False)
    phone       = Column(String(20))
    email       = Column(String(180))
    region      = Column(String(60))
    message     = Column(Text)
    status      = Column(SAEnum(EnquiryStatusEnum), default=EnquiryStatusEnum.new)
    source      = Column(String(40), default="website")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    listing = relationship("Listing", back_populates="enquiries")


# ── Listing Submission ────────────────────────────────────────────────────────

class ListingSubmission(Base):
    __tablename__ = "listing_submissions"

    id            = Column(Integer, primary_key=True, index=True)
    owner_name    = Column(String(120), nullable=False)
    owner_phone   = Column(String(20),  nullable=False)
    owner_email   = Column(String(180))
    owner_role    = Column(String(60))
    title         = Column(String(180))
    listing_type  = Column(String(60))
    property_type = Column(String(60))
    region        = Column(String(60))
    location      = Column(String(100))
    beds          = Column(String(10))
    baths         = Column(String(10))
    sqm           = Column(String(20))
    price         = Column(String(40))
    negotiable    = Column(String(40))
    amenities     = Column(Text)
    description   = Column(Text)
    available_from= Column(String(80))
    youtube_url   = Column(String(250))
    notes         = Column(Text)
    is_reviewed   = Column(Boolean, default=False)
    is_converted  = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Admin Config ──────────────────────────────────────────────────────────────

class AdminConfig(Base):
    """Single-row table that persists admin credentials across restarts."""
    __tablename__ = "admin_config"

    id            = Column(Integer, primary_key=True, default=1)
    password_hash = Column(String(255), nullable=False)
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())