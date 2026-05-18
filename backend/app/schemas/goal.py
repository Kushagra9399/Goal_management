from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.schemas.achievement import AchievementResponse

class GoalBase(BaseModel):
    thrust_area: str
    title: str
    description: Optional[str] = None
    uom: str  # "numeric", "percentage", "timeline", "zero-based"
    target: float
    weightage: int
    quarter: str = "Q1"

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    thrust_area: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    uom: Optional[str] = None
    target: Optional[float] = None
    weightage: Optional[int] = None
    quarter: Optional[str] = None
    status: Optional[str] = None
    locked: Optional[bool] = None
    review_comment: Optional[str] = None

class GoalResponse(GoalBase):
    id: int
    employee_id: int
    status: str
    locked: bool
    review_comment: Optional[str] = None
    created_at: datetime
    achievements: List[AchievementResponse] = []

    class Config:
        from_attributes = True
        
class ManagerGoalUpdateInline(BaseModel):
    weightage: Optional[int] = None
    target: Optional[float] = None
    review_comment: Optional[str] = None

class GoalSubmitRequest(BaseModel):
    goal_ids: List[int]
