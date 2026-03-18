from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.enums import ProjectApplicationStatus


class ProjectApplication(Base):
    __tablename__ = "project_application"
    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "member_id",
            "status",
            name="uq_project_application_project_member_status",
        ),
        Index("ix_project_application_project_id", "project_id"),
        Index("ix_project_application_member_id", "member_id"),
        Index("ix_project_application_status", "status"),
    )

    application_id: Mapped[int] = mapped_column(primary_key=True)

    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.project_id", ondelete="CASCADE"),
        nullable=False,
    )

    member_id: Mapped[int] = mapped_column(
        ForeignKey("member.member_id", ondelete="CASCADE"),
        nullable=False,
    )

    desired_role: Mapped[str] = mapped_column(String(60), nullable=False)
    application_text: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[ProjectApplicationStatus] = mapped_column(
        Enum(
            ProjectApplicationStatus,
            name="project_application_status",
            native_enum=True,
        ),
        nullable=False,
        server_default=ProjectApplicationStatus.pending.value,
    )

    manager_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    reviewed_by_member_id: Mapped[int | None] = mapped_column(
        ForeignKey("member.member_id", ondelete="SET NULL"),
        nullable=True,
    )

    project = relationship("Project", back_populates="applications")
    member = relationship(
        "Member",
        back_populates="project_applications",
        foreign_keys=[member_id],
    )
    reviewed_by = relationship(
        "Member",
        foreign_keys=[reviewed_by_member_id],
    )