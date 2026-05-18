from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AchievementBase(BaseModel):
    goal_id: int
    quarter: str
    planned_target: float
    actual_achievement: Optional[float] = None
    progress_status: str = "Not Started"
    employee_comment: Optional[str] = None

class AchievementCreate(BaseModel):
    goal_id: int
    quarter: str
    planned_target: float

class AchievementUpdate(BaseModel):
    actual_achievement: float
    progress_status: str  # "Not Started", "On Track", "Completed"
    employee_comment: Optional[str] = None

class AchievementCheckIn(BaseModel):
    manager_comment: str

class AchievementResponse(BaseModel):
    id: int
    goal_id: int
    quarter: str
    planned_target: float
    actual_achievement: Optional[float] = None
    progress_status: str
    score: float
    employee_comment: Optional[str] = None
    manager_comment: Optional[str] = None
    checkin_date: Optional[datetime] = None

    class Config:
        from_attributes = True
