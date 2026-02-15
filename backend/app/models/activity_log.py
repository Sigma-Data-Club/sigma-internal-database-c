from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class ActivityLog(Base):
    __tablename__ = "activity_log"

    log_id: Mapped[int] = mapped_column(primary_key=True)

    member_id: Mapped[int] = mapped_column(ForeignKey("member.member_id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    action: Mapped[str] = mapped_column(String(30), nullable=False)       # READ/CREATE/UPDATE/DELETE/LOGIN/EXPORT...
    entity_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(80), nullable=True)

    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    member = relationship("Member", back_populates="activity_logs")
