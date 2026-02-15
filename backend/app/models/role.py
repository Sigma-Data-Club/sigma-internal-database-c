from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class Role(Base):
    __tablename__ = "role"

    role_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    members = relationship("MemberRole", back_populates="role", cascade="all, delete-orphan")
