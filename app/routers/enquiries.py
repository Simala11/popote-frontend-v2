from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.models import Enquiry, EnquiryStatusEnum
from app.schemas.schemas import EnquiryCreate, EnquiryOut, EnquiryStatusUpdate

router = APIRouter(prefix="/enquiries", tags=["Enquiries"])


@router.post("", response_model=EnquiryOut, status_code=status.HTTP_201_CREATED)
def create_enquiry(body: EnquiryCreate, db: Session = Depends(get_db)):
    """
    Public — submit an enquiry from the website.
    Validates that at least phone or email is provided.
    """
    enquiry = Enquiry(**body.model_dump())
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return enquiry


@router.get("", response_model=list[EnquiryOut])
def get_enquiries(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    status_filter: Optional[str] = None,
    listing_id: Optional[int] = None,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin — list all enquiries with optional filters."""
    q = db.query(Enquiry)
    if status_filter:
        q = q.filter(Enquiry.status == status_filter)
    if listing_id:
        q = q.filter(Enquiry.listing_id == listing_id)
    return q.order_by(Enquiry.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()


@router.patch("/{enquiry_id}/status", response_model=EnquiryOut)
def update_enquiry_status(
    enquiry_id: int,
    body: EnquiryStatusUpdate,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin — cycle enquiry status: New → Read → Replied."""
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    enquiry.status = body.status
    db.commit()
    db.refresh(enquiry)
    return enquiry


@router.delete("/{enquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enquiry(
    enquiry_id: int,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin — delete an enquiry."""
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    db.delete(enquiry)
    db.commit()
