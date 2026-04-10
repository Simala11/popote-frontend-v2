from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.models import Listing, ListingImage, RegionEnum, CategoryEnum
from app.schemas.schemas import (
    ListingCreate, ListingUpdate, ListingOut, ListingListOut, ListingsPage
)
from app.services.cloudinary_service import (
    upload_multiple_images, upload_image, delete_image, delete_multiple_images
)

router = APIRouter(prefix="/listings", tags=["Listings"])


# ── Public endpoints ──────────────────────────────────────────────────────────

@router.get("", response_model=ListingsPage)
def get_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    region: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    beds: Optional[int] = None,
    featured_only: bool = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Public listing feed with filtering and pagination.
    All params are optional — returns all active listings by default.
    """
    q = db.query(Listing).filter(Listing.is_active == True)

    if region:
        q = q.filter(Listing.region == region)
    if category:
        q = q.filter(Listing.category == category)
    if min_price is not None:
        q = q.filter(Listing.price >= min_price)
    if max_price is not None:
        q = q.filter(Listing.price <= max_price)
    if beds is not None:
        q = q.filter(Listing.beds == beds)
    if featured_only:
        q = q.filter(Listing.is_featured == True)
    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                Listing.title.ilike(term),
                Listing.location.ilike(term),
                Listing.description.ilike(term),
            )
        )

    total = q.count()
    results = (
        q.order_by(Listing.is_featured.desc(), Listing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ListingsPage(total=total, page=page, page_size=page_size, results=results)


@router.get("/{listing_id}", response_model=ListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    """Get a single listing by ID and increment its view count."""
    listing = db.query(Listing).filter(
        Listing.id == listing_id, Listing.is_active == True
    ).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Increment views
    listing.views = (listing.views or 0) + 1
    db.commit()
    db.refresh(listing)
    return listing


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.post("", response_model=ListingOut, status_code=status.HTTP_201_CREATED)
def create_listing(
    body: ListingCreate,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a listing (no images yet — upload images separately)."""
    listing = Listing(**body.model_dump())
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.post("/{listing_id}/images", response_model=ListingOut)
async def upload_listing_images(
    listing_id: int,
    files: List[UploadFile] = File(...),
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Upload 1–15 images for a listing.
    Images are stored in Cloudinary under folder 'popote_estate/listings/<id>'.
    Returns the updated listing with all image URLs.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    folder = f"popote_estate/listings/{listing_id}"
    uploaded = await upload_multiple_images(files, folder=folder)

    existing_count = db.query(ListingImage).filter(ListingImage.listing_id == listing_id).count()

    for i, img_data in enumerate(uploaded):
        img = ListingImage(
            listing_id=listing_id,
            url=img_data["url"],
            public_id=img_data["public_id"],
            width=img_data.get("width"),
            height=img_data.get("height"),
            format=img_data.get("format"),
            size_bytes=img_data.get("size"),
            order=existing_count + i,
            is_primary=(existing_count == 0 and i == 0),
        )
        db.add(img)

    db.commit()
    db.refresh(listing)
    return listing


@router.delete("/{listing_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing_image(
    listing_id: int,
    image_id: int,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a specific image from a listing (also removes from Cloudinary)."""
    img = db.query(ListingImage).filter(
        ListingImage.id == image_id, ListingImage.listing_id == listing_id
    ).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    delete_image(img.public_id)
    db.delete(img)
    db.commit()


@router.patch("/{listing_id}", response_model=ListingOut)
def update_listing(
    listing_id: int,
    body: ListingUpdate,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Partial update of a listing."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(listing, field, value)

    db.commit()
    db.refresh(listing)
    return listing


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    listing_id: int,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Hard-delete a listing and ALL its Cloudinary images.
    Consider soft-delete (is_active=False) for production.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Delete all images from Cloudinary first
    public_ids = [img.public_id for img in listing.images]
    delete_multiple_images(public_ids)

    db.delete(listing)
    db.commit()


@router.get("/admin/all", response_model=ListingsPage)
def admin_get_all_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    include_inactive: bool = True,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin view — includes inactive listings."""
    q = db.query(Listing)
    if not include_inactive:
        q = q.filter(Listing.is_active == True)
    total = q.count()
    results = q.order_by(Listing.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ListingsPage(total=total, page=page, page_size=page_size, results=results)
