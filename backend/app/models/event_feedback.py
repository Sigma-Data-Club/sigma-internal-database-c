from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, Text, CheckConstraint, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text
from app.db.database import Base

class EventFeedback(Base):
    __tablename__ = "event_feedback"
    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="rating_1_to_5"),
        # One feedback per person per event (anonymous allowed multiple because member_id IS NULL)
        Index(
            "ux_event_feedback_one_per_member",
            "event_id",
            "member_id",
            unique=True,
            postgresql_where=text("member_id IS NOT NULL"),
        ),
    )

    feedback_id: Mapped[int] = mapped_column(primary_key=True)

    event_id: Mapped[int] = mapped_column(
        ForeignKey("event.event_id", ondelete="CASCADE"),
        nullable=False,
    )
    member_id: Mapped[int | None] = mapped_column(
        ForeignKey("member.member_id", ondelete="SET NULL"),
        nullable=True,
    )

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    review_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    event = relationship("Event", back_populates="feedbacks")
    member = relationship("Member", back_populates="event_feedbacks")
