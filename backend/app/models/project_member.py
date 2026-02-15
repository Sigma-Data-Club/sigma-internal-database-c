from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class ProjectMember(Base):
    __tablename__ = "project_member"
    __table_args__ = (
        CheckConstraint("left_at IS NULL OR left_at >= joined_at", name="left_after_joined"),
    )

    project_id: Mapped[int] = mapped_column(ForeignKey("project.project_id", ondelete="CASCADE"), primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("member.member_id", ondelete="CASCADE"), primary_key=True)

    project_role: Mapped[str] = mapped_column(String(60), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="members")
    member = relationship("Member", back_populates="projects")
