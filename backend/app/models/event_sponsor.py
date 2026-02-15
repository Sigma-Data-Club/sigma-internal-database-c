from sqlalchemy import ForeignKey, Numeric, String, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class EventSponsor(Base):
    __tablename__ = "event_sponsor"
    __table_args__ = (
        CheckConstraint("money_amount IS NULL OR money_amount >= 0", name="money_amount_non_negative"),
        CheckConstraint("in_kind_estimated_value IS NULL OR in_kind_estimated_value >= 0", name="in_kind_value_non_negative"),
        CheckConstraint(
            "money_amount IS NOT NULL OR in_kind_description IS NOT NULL OR in_kind_estimated_value IS NOT NULL",
            name="sponsor_contribution_present",
        ),
    )

    event_id: Mapped[int] = mapped_column(ForeignKey("event.event_id", ondelete="CASCADE"), primary_key=True)
    sponsor_id: Mapped[int] = mapped_column(ForeignKey("sponsor.sponsor_id", ondelete="CASCADE"), primary_key=True)

    money_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    money_currency: Mapped[str | None] = mapped_column(String(3), nullable=True)

    in_kind_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    in_kind_estimated_value: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    event = relationship("Event", back_populates="sponsors")
    sponsor = relationship("Sponsor", back_populates="events")
