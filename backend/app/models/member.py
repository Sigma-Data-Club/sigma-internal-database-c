from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Member(Base):
    __tablename__ = "member"

    __table_args__ = (
        CheckConstraint(
            "study_year IS NULL OR study_year BETWEEN 1 AND 8",
            name="study_year_valid_range",
        ),
    )

    member_id: Mapped[int] = mapped_column(primary_key=True)

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)

    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    phone: Mapped[str | None] = mapped_column(String(60), nullable=True)

    academic_program_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_program.academic_program_id", ondelete="SET NULL"),
        nullable=True,
    )

    study_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="true",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    academic_program = relationship("AcademicProgram")

    roles = relationship(
        "MemberRole",
        back_populates="member",
        cascade="all, delete-orphan",
    )

    projects = relationship(
        "ProjectMember",
        back_populates="member",
        cascade="all, delete-orphan",
    )

    project_applications = relationship(
        "ProjectApplication",
        back_populates="member",
        cascade="all, delete-orphan",
        foreign_keys="ProjectApplication.member_id",
    )

    event_applications = relationship(
        "EventApplication",
        back_populates="member",
        cascade="all, delete-orphan",
    )

    academic_credits = relationship(
        "AcademicCredit",
        back_populates="member",
        cascade="all, delete-orphan",
    )

    activity_logs = relationship(
        "ActivityLog",
        back_populates="member",
        cascade="all, delete-orphan",
    )

    auth = relationship(
        "MemberAuth",
        back_populates="member",
        uselist=False,
        cascade="all, delete-orphan",
    )

    sessions = relationship(
        "AuthSession",
        back_populates="member",
        cascade="all, delete-orphan",
    )