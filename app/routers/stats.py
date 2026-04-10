from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.models import Listing, Enquiry, ListingSubmission, EnquiryStatusEnum
from app.schemas.schemas import StatsOut

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("", response_model=StatsOut)
def get_stats(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin dashboard — key metrics at a glance."""
    return StatsOut(
        total_listings=db.query(Listing).count(),
        active_listings=db.query(Listing).filter(Listing.is_active == True).count(),
        total_enquiries=db.query(Enquiry).count(),
        new_enquiries=db.query(Enquiry).filter(Enquiry.status == EnquiryStatusEnum.new).count(),
        total_submissions=db.query(ListingSubmission).count(),
        pending_submissions=db.query(ListingSubmission).filter(ListingSubmission.is_reviewed == False).count(),
    )
