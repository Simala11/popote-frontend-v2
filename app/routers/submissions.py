from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.models import ListingSubmission
from app.schemas.schemas import SubmissionCreate, SubmissionOut

router = APIRouter(prefix="/submissions", tags=["Listing Submissions"])


@router.post("", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
def create_submission(body: SubmissionCreate, db: Session = Depends(get_db)):
    """
    Public — 'List With Us' form submission.
    Stores owner details and property info for admin review.
    """
    submission = ListingSubmission(**body.model_dump())
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("", response_model=list[SubmissionOut])
def get_submissions(
    reviewed: bool = None,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin — view all listing submissions."""
    q = db.query(ListingSubmission)
    if reviewed is not None:
        q = q.filter(ListingSubmission.is_reviewed == reviewed)
    return q.order_by(ListingSubmission.created_at.desc()).all()


@router.patch("/{submission_id}/reviewed", response_model=SubmissionOut)
def mark_reviewed(
    submission_id: int,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin — mark a submission as reviewed."""
    sub = db.query(ListingSubmission).filter(ListingSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub.is_reviewed = True
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission(
    submission_id: int,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin — delete a submission."""
    sub = db.query(ListingSubmission).filter(ListingSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    db.delete(sub)
    db.commit()
