from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    manager_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
        
class TeamMemberResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime
    goal_completion_rate: Optional[float] = 0.0

    class Config:
        from_attributes = True
