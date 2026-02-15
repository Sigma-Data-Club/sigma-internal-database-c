from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class Event(Base):
    __tablename__ = "event"
    __table_args__ = (
        CheckConstraint("end_datetime IS NULL OR end_datetime >= start_datetime", name="event_end_after_start"),
    )

    event_id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)

    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    speaker_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    topic: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_by_member_id: Mapped[int | None] = mapped_column(
        ForeignKey("member.member_id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    applications = relationship("EventApplication", back_populates="event", cascade="all, delete-orphan")
    feedbacks = relationship("EventFeedback", back_populates="event", cascade="all, delete-orphan")
    sponsors = relationship("EventSponsor", back_populates="event", cascade="all, delete-orphan")
