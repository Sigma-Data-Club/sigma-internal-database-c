from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Enum, func, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.enums import DecisionStatus, AttendanceStatus, AttendanceMode


class EventApplication(Base):
    __tablename__ = "event_application"

    event_id: Mapped[int] = mapped_column(
        ForeignKey("event.event_id", ondelete="CASCADE"),
        primary_key=True,
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("member.member_id", ondelete="CASCADE"),
        primary_key=True,
    )

    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    decision_status: Mapped[DecisionStatus] = mapped_column(
        Enum(DecisionStatus, name="decision_status", native_enum=True),
        nullable=False,
        server_default=DecisionStatus.pending.value,
    )

    attendance_status: Mapped[AttendanceStatus] = mapped_column(
        Enum(AttendanceStatus, name="attendance_status", native_enum=True),
        nullable=False,
        server_default=AttendanceStatus.unknown.value,
    )

    attendance_mode: Mapped[AttendanceMode | None] = mapped_column(
        Enum(AttendanceMode, name="attendance_mode", native_enum=True),
        nullable=True,
    )

    # Feedback (embedded into event_application)
    feedback_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    feedback_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    feedback_submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    event = relationship("Event", back_populates="applications")
    member = relationship("Member", back_populates="event_applications")