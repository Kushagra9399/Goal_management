from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    quarter = Column(String, nullable=False)  # "Q1", "Q2", "Q3", "Q4"
    planned_target = Column(Float, nullable=False)
    actual_achievement = Column(Float, nullable=True)
    progress_status = Column(String, default="Not Started")  # "Not Started", "On Track", "Completed"
    score = Column(Float, default=0.0)
    employee_comment = Column(String, nullable=True)
    manager_comment = Column(String, nullable=True)
    checkin_date = Column(DateTime, nullable=True)

    # Relationships
    goal = relationship("Goal", back_populates="achievements")
