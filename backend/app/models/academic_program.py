from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class AcademicProgram(Base):
    __tablename__ = "academic_program"

    academic_program_id: Mapped[int] = mapped_column(primary_key=True)
    program_name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
