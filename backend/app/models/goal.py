from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    thrust_area = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    uom = Column(String, nullable=False)  # "numeric", "percentage", "timeline", "zero-based"
    target = Column(Float, nullable=False)  # Stored as numeric/float
    weightage = Column(Integer, nullable=False)
    quarter = Column(String, nullable=False, default="Q1")  # "Q1", "Q2", "Q3", "Q4"
    status = Column(String, default="Draft")  # "Draft", "Pending Approval", "Approved", "Rejected"
    locked = Column(Boolean, default=False)
    review_comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("User", back_populates="goals")
    achievements = relationship("Achievement", back_populates="goal", cascade="all, delete-orphan")
