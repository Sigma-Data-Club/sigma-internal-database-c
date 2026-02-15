from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class Permission(Base):
    __tablename__ = "permission"

    permission_id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    roles = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")
