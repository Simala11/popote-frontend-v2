from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
from app.models.models import RegionEnum, CategoryEnum, EnquiryStatusEnum


# ── Image ─────────────────────────────────────────────────────────────────────

class ImageOut(BaseModel):
    id: int
    url: str
    public_id: str
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None
    order: int
    is_primary: bool

    class Config:
        from_attributes = True


# ── Listing ───────────────────────────────────────────────────────────────────

class ListingCreate(BaseModel):
    title: str
    region: RegionEnum
    location: Optional[str] = None
    category: CategoryEnum
    price: float
    price_display: Optional[str] = None
    beds: Optional[int] = None
    baths: Optional[int] = None
    sqm: Optional[int] = None
    description: Optional[str] = None
    youtube_url: Optional[str] = None
    amenities: Optional[str] = None
    is_featured: bool = False

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be positive")
        return v

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    region: Optional[RegionEnum] = None
    location: Optional[str] = None
    category: Optional[CategoryEnum] = None
    price: Optional[float] = None
    price_display: Optional[str] = None
    beds: Optional[int] = None
    baths: Optional[int] = None
    sqm: Optional[int] = None
    description: Optional[str] = None
    youtube_url: Optional[str] = None
    amenities: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class ListingOut(BaseModel):
    id: int
    title: str
    region: RegionEnum
    location: Optional[str]
    category: CategoryEnum
    price: float
    price_display: Optional[str]
    beds: Optional[int]
    baths: Optional[int]
    sqm: Optional[int]
    description: Optional[str]
    youtube_url: Optional[str]
    amenities: Optional[str]
    is_active: bool
    is_featured: bool
    views: int
    images: List[ImageOut] = []
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ListingListOut(BaseModel):
    id: int
    title: str
    region: RegionEnum
    location: Optional[str]
    category: CategoryEnum
    price: float
    price_display: Optional[str]
    beds: Optional[int]
    baths: Optional[int]
    sqm: Optional[int]
    is_active: bool
    is_featured: bool
    images: List[ImageOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ListingsPage(BaseModel):
    total: int
    page: int
    page_size: int
    results: List[ListingListOut]


# ── Enquiry ───────────────────────────────────────────────────────────────────

class EnquiryCreate(BaseModel):
    listing_id: Optional[int] = None
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    region: Optional[str] = None
    message: Optional[str] = None
    source: str = "website"

    @model_validator(mode="after")
    def phone_or_email(self):
        if not self.phone and not self.email:
            raise ValueError("At least one of phone or email is required")
        return self


class EnquiryStatusUpdate(BaseModel):
    status: EnquiryStatusEnum


class EnquiryOut(BaseModel):
    id: int
    listing_id: Optional[int]
    name: str
    phone: Optional[str]
    email: Optional[str]
    region: Optional[str]
    message: Optional[str]
    status: EnquiryStatusEnum
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Listing Submission ────────────────────────────────────────────────────────

class SubmissionCreate(BaseModel):
    owner_name: str
    owner_phone: str
    owner_email: Optional[EmailStr] = None
    owner_role: Optional[str] = None
    title: Optional[str] = None
    listing_type: Optional[str] = None
    property_type: Optional[str] = None
    region: Optional[str] = None
    location: Optional[str] = None
    beds: Optional[str] = None
    baths: Optional[str] = None
    sqm: Optional[str] = None
    price: Optional[str] = None
    negotiable: Optional[str] = None
    amenities: Optional[str] = None
    description: Optional[str] = None
    available_from: Optional[str] = None
    youtube_url: Optional[str] = None
    notes: Optional[str] = None


class SubmissionOut(BaseModel):
    id: int
    owner_name: str
    owner_phone: str
    owner_email: Optional[str]
    title: Optional[str]
    region: Optional[str]
    price: Optional[str]
    is_reviewed: bool
    is_converted: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ── Stats ─────────────────────────────────────────────────────────────────────

class StatsOut(BaseModel):
    total_listings: int
    active_listings: int
    total_enquiries: int
    new_enquiries: int
    total_submissions: int
    pending_submissions: int