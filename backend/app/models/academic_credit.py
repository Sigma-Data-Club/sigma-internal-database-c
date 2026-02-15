from sqlalchemy import ForeignKey, Numeric, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class AcademicCredit(Base):
    __tablename__ = "academic_credit"
    __table_args__ = (
        CheckConstraint("credits_amount > 0", name="credits_positive"),
        CheckConstraint(
            "(project_id IS NOT NULL AND event_id IS NULL) OR (project_id IS NULL AND event_id IS NOT NULL)",
            name="academic_credit_exactly_one_target",
        ),
    )

    credit_id: Mapped[int] = mapped_column(primary_key=True)

    member_id: Mapped[int] = mapped_column(ForeignKey("member.member_id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("project.project_id", ondelete="SET NULL"), nullable=True)
    event_id: Mapped[int | None] = mapped_column(ForeignKey("event.event_id", ondelete="SET NULL"), nullable=True)

    credits_amount: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    member = relationship("Member", back_populates="academic_credits")
    project = relationship("Project")
    event = relationship("Event")
