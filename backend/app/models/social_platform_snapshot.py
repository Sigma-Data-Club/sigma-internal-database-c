from datetime import date
from sqlalchemy import Date, Integer, String, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class SocialPlatformSnapshot(Base):
    __tablename__ = "social_platform_snapshot"
    __table_args__ = (
        UniqueConstraint("platform", "snapshot_date", name="ux_social_platform_snapshot"),
        CheckConstraint("followers >= 0", name="followers_non_negative"),
        CheckConstraint("reach IS NULL OR reach >= 0", name="reach_non_negative"),
        CheckConstraint("likes IS NULL OR likes >= 0", name="likes_non_negative"),
        CheckConstraint("shares IS NULL OR shares >= 0", name="shares_non_negative"),
        CheckConstraint("comments IS NULL OR comments >= 0", name="comments_non_negative"),
    )

    snapshot_id: Mapped[int] = mapped_column(primary_key=True)
    platform: Mapped[str] = mapped_column(String(60), nullable=False)
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False)

    followers: Mapped[int] = mapped_column(Integer, nullable=False)
    reach: Mapped[int | None] = mapped_column(Integer, nullable=True)
    likes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    shares: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comments: Mapped[int | None] = mapped_column(Integer, nullable=True)
