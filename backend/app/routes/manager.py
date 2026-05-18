from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, check_role
from app.models.user import User
from app.models.goal import Goal
from app.models.achievement import Achievement
from app.schemas.goal import GoalResponse, ManagerGoalUpdateInline
from app.schemas.user import TeamMemberResponse
from app.schemas.achievement import AchievementResponse, AchievementCheckIn
from app.services.audit_service import AuditService
from app.services.goal_service import GoalService

router = APIRouter(prefix="/manager", tags=["manager"])

@router.get("/team", response_model=List[TeamMemberResponse])
def get_team(
    current_user: User = Depends(check_role(["manager", "admin"])),
    db: Session = Depends(get_db)
):
    # If admin, show all users. If manager, show team members where manager_id = manager.id.
    if current_user.role == "admin":
        team = db.query(User).filter(User.role == "employee").all()
    else:
        team = db.query(User).filter(User.manager_id == current_user.id).all()
        
    team_responses = []
    for member in team:
        # Calculate completion rate of approved goals
        goals = db.query(Goal).filter(Goal.employee_id == member.id, Goal.status == "Approved").all()
        goal_ids = [g.id for g in goals]
        
        avg_score = 0.0
        if goal_ids:
            # Query all achievements
            achievements = db.query(Achievement).filter(
                Achievement.goal_id.in_(goal_ids),
                Achievement.actual_achievement.isnot(None)
            ).all()
            if achievements:
                # Sum of weighted scores
                # Goal score is usually computed, let's take average score of all active achievements
                scores = [a.score for a in achievements]
                avg_score = sum(scores) / len(scores) if scores else 0.0
                
        team_responses.append(
            TeamMemberResponse(
                id=member.id,
                name=member.name,
                email=member.email,
                role=member.role,
                created_at=member.created_at,
                goal_completion_rate=round(avg_score, 2)
            )
        )
    return team_responses

@router.get("/team/{employee_id}/goals", response_model=List[GoalResponse])
def get_member_goals(
    employee_id: int,
    current_user: User = Depends(check_role(["manager", "admin"])),
    db: Session = Depends(get_db)
):
    # Verify manager owns team member
    member = db.query(User).filter(User.id == employee_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if current_user.role != "admin" and member.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view goals of your direct team members"
        )
        
    return db.query(Goal).filter(Goal.employee_id == employee_id).all()

@router.put("/approve/{goal_id}", response_model=GoalResponse)
def approve_goal(
    goal_id: int,
    inline_update: Optional[ManagerGoalUpdateInline] = None,
    current_user: User = Depends(check_role(["manager", "admin"])),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    member = db.query(User).filter(User.id == goal.employee_id).first()
    if current_user.role != "admin" and member.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only approve goals of your direct team members"
        )

    old_val = f"Status: {goal.status}, Locked: {goal.locked}, Target: {goal.target}, Weightage: {goal.weightage}"

    # Inline modifications by manager before approval
    if inline_update:
        if inline_update.weightage is not None:
            goal.weightage = inline_update.weightage
        if inline_update.target is not None:
            goal.target = inline_update.target
            # Sync to planned targets in achievements
            db.query(Achievement).filter(Achievement.goal_id == goal.id).update(
                {"planned_target": goal.target}
            )
        if inline_update.review_comment is not None:
            goal.review_comment = inline_update.review_comment

    goal.status = "Approved"
    goal.locked = True
    db.commit()
    db.refresh(goal)

    new_val = f"Status: {goal.status}, Locked: {goal.locked}, Target: {goal.target}, Weightage: {goal.weightage}"

    AuditService.log_action(
        db,
        user_id=current_user.id,
        action="Goal Approved",
        entity_type="Goal",
        entity_id=goal.id,
        old_value=old_val,
        new_value=new_val
    )

    return goal

@router.put("/reject/{goal_id}", response_model=GoalResponse)
def reject_goal(
    goal_id: int,
    inline_update: ManagerGoalUpdateInline,
    current_user: User = Depends(check_role(["manager", "admin"])),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    member = db.query(User).filter(User.id == goal.employee_id).first()
    if current_user.role != "admin" and member.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only reject goals of your direct team members"
        )

    old_val = f"Status: {goal.status}, Locked: {goal.locked}"

    goal.status = "Rejected"
    goal.locked = False
    if inline_update.review_comment:
        goal.review_comment = inline_update.review_comment

    db.commit()
    db.refresh(goal)

    new_val = f"Status: {goal.status}, Locked: {goal.locked}, Comment: {goal.review_comment}"

    AuditService.log_action(
        db,
        user_id=current_user.id,
        action="Goal Rejected",
        entity_type="Goal",
        entity_id=goal.id,
        old_value=old_val,
        new_value=new_val
    )

    return goal

@router.post("/check-in/{achievement_id}", response_model=AchievementResponse)
def manager_checkin(
    achievement_id: int,
    checkin_data: AchievementCheckIn,
    current_user: User = Depends(check_role(["manager", "admin"])),
    db: Session = Depends(get_db)
):
    achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement record not found")
        
    # Verify manager owns team member
    goal = db.query(Goal).filter(Goal.id == achievement.goal_id).first()
    member = db.query(User).filter(User.id == goal.employee_id).first()
    
    if current_user.role != "admin" and member.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review achievements of your direct team members"
        )

    old_val = f"Manager comment: {achievement.manager_comment}"
    
    achievement.manager_comment = checkin_data.manager_comment
    achievement.checkin_date = datetime.utcnow()
    
    db.commit()
    db.refresh(achievement)

    AuditService.log_action(
        db,
        user_id=current_user.id,
        action="Check-in Feedback Added",
        entity_type="Achievement",
        entity_id=achievement.id,
        old_value=old_val,
        new_value=f"Manager comment: {achievement.manager_comment}"
    )

    return achievement
