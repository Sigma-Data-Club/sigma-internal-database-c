from datetime import date

from sqlalchemy import String, Text, Date, Enum, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.enums import ProjectStatus


class Project(Base):
    __tablename__ = "project"
    __table_args__ = (
        CheckConstraint(
            "finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at",
            name="project_finish_after_start",
        ),
    )

    project_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, name="project_status", native_enum=True),
        nullable=False,
        server_default=ProjectStatus.planned.value,
    )

    started_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    finished_at: Mapped[date | None] = mapped_column(Date, nullable=True)

    members = relationship(
        "ProjectMember",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    applications = relationship(
        "ProjectApplication",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    finance_transactions = relationship(
        "FinanceTransaction",
        back_populates="project",
    )