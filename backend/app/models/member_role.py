from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class MemberRole(Base):
    __tablename__ = "member_role"

    member_id: Mapped[int] = mapped_column(ForeignKey("member.member_id", ondelete="CASCADE"), primary_key=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("role.role_id", ondelete="CASCADE"), primary_key=True)

    member = relationship("Member", back_populates="roles")
    role = relationship("Role", back_populates="members")
