from datetime import date
from sqlalchemy import Date, ForeignKey, Integer, String, Text, Enum, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from app.models.enums import FinanceTransactionType

class FinanceTransaction(Base):
    __tablename__ = "finance_transaction"
    __table_args__ = (
        CheckConstraint("amount_cents > 0", name="amount_cents_positive"),
    )

    transaction_id: Mapped[int] = mapped_column(primary_key=True)

    type: Mapped[FinanceTransactionType] = mapped_column(
        Enum(FinanceTransactionType, name="finance_transaction_type", native_enum=True),
        nullable=False,
    )

    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)

    project_id: Mapped[int | None] = mapped_column(ForeignKey("project.project_id", ondelete="SET NULL"), nullable=True)
    event_id: Mapped[int | None] = mapped_column(ForeignKey("event.event_id", ondelete="SET NULL"), nullable=True)
    created_by_member_id: Mapped[int | None] = mapped_column(ForeignKey("member.member_id", ondelete="SET NULL"), nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    project = relationship("Project", back_populates="finance_transactions")
    event = relationship("Event")
    created_by = relationship("Member")
