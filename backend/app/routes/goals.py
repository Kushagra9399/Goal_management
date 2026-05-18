from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, check_role
from app.models.user import User
from app.models.goal import Goal
from app.models.achievement import Achievement
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse, GoalSubmitRequest
from app.schemas.achievement import AchievementUpdate, AchievementResponse
from app.services.goal_service import GoalService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("", response_model=List[GoalResponse])
def get_my_goals(
    quarter: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Goal).filter(Goal.employee_id == current_user.id)
    if quarter:
        query = query.filter(Goal.quarter == quarter)
    return query.all()

@router.post("", response_model=GoalResponse)
def create_goal(
    goal_in: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only Employee can create goals
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can create goals"
        )
    return GoalService.create_goal(db, goal_in, current_user.id)

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    goal_in: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
        
    if goal.employee_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own goals"
        )
        
    is_admin = current_user.role == "admin"
    return GoalService.update_goal(db, goal_id, goal_in, current_user.id, is_admin=is_admin)

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
        
    if goal.employee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own goals"
        )
        
    if goal.locked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Locked goals cannot be deleted"
        )

    title = goal.title
    db.delete(goal)
    db.commit()

    AuditService.log_action(
        db,
        user_id=current_user.id,
        action="Goal Deleted",
        entity_type="Goal",
        entity_id=goal_id,
        old_value=f"Title: {title}"
    )

    return {"message": "Goal deleted successfully"}

@router.post("/submit")
def submit_goals(
    submit_req: GoalSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can submit goals"
        )

    goals = db.query(Goal).filter(Goal.id.in_(submit_req.goal_ids), Goal.employee_id == current_user.id).all()
    if len(goals) != len(submit_req.goal_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more goals not found"
        )

    # Perform backend validations
    GoalService.validate_goals_for_submission(goals)

    # Update statuses
    for goal in goals:
        if goal.status in ["Draft", "Rejected"]:
            old_status = goal.status
            goal.status = "Pending Approval"
            AuditService.log_action(
                db,
                user_id=current_user.id,
                action="Goal Submitted",
                entity_type="Goal",
                entity_id=goal.id,
                old_value=old_status,
                new_value="Pending Approval"
            )

    db.commit()
    return {"message": "Goals submitted successfully for approval"}

# ACHIEVEMENTS SUB-ROUTER / ENDPOINTS

@router.get("/achievements/{goal_id}", response_model=List[AchievementResponse])
def get_achievements(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
        
    # Check permission (Employee, Manager L1, or Admin)
    if goal.employee_id != current_user.id:
        # Check if manager
        emp = db.query(User).filter(User.id == goal.employee_id).first()
        if not emp or (emp.manager_id != current_user.id and current_user.role != "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to these achievements"
            )
            
    return db.query(Achievement).filter(Achievement.goal_id == goal_id).all()

@router.post("/achievements", response_model=AchievementResponse)
def update_achievement(
    goal_id: int,
    quarter: str,
    ach_in: AchievementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only Employee can update their achievements
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can update actual achievements"
        )

    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
        
    if goal.employee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update achievements for your own goals"
        )

    # In modern performance systems, employees can submit achievements even if goal is locked.
    # In fact, goals are locked so they can't change targets, but they CAN input achievement data!
    # Let's find or create the achievement record for the quarter
    achievement = db.query(Achievement).filter(
        Achievement.goal_id == goal_id,
        Achievement.quarter == quarter
    ).first()

    if not achievement:
        # Create a new record if it somehow doesn't exist
        achievement = Achievement(
            goal_id=goal_id,
            quarter=quarter,
            planned_target=goal.target
        )
        db.add(achievement)

    old_val = f"Actual: {achievement.actual_achievement}, Status: {achievement.progress_status}, Score: {achievement.score}"

    achievement.actual_achievement = ach_in.actual_achievement
    achievement.progress_status = ach_in.progress_status
    achievement.employee_comment = ach_in.employee_comment
    
    # Compute score dynamically!
    achievement.score = GoalService.calculate_progress_score(
        uom=goal.uom,
        target=achievement.planned_target,
        achievement=ach_in.actual_achievement
    )

    db.commit()
    db.refresh(achievement)

    new_val = f"Actual: {achievement.actual_achievement}, Status: {achievement.progress_status}, Score: {achievement.score}"

    AuditService.log_action(
        db,
        user_id=current_user.id,
        action="Achievement Updated",
        entity_type="Achievement",
        entity_id=achievement.id,
        old_value=old_val,
        new_value=new_val
    )

    return achievement
