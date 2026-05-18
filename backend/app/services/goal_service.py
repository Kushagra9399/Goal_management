from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.goal import Goal
from app.models.achievement import Achievement
from app.schemas.goal import GoalCreate, GoalUpdate
from app.services.audit_service import AuditService

class GoalService:
    @staticmethod
    def calculate_progress_score(uom: str, target: float, achievement: float) -> float:
        if achievement is None:
            return 0.0
        
        uom_lower = uom.lower()
        if uom_lower == "zero-based":
            return 100.0 if achievement == 0 else 0.0
        
        if uom_lower == "timeline":
            # Target is the deadline (e.g., target completion day/score, or lower value is better)
            # If achievement <= target (completed within or before deadline), score is 100
            return 100.0 if achievement <= target else 0.0
        
        # Numeric / Percentage (Higher is better)
        if target == 0:
            return 0.0
        
        score = (achievement / target) * 100.0
        return round(max(0.0, score), 2)

    @staticmethod
    def validate_goals_for_submission(goals: list[Goal]):
        if not goals:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No goals selected for submission"
            )
            
        if len(goals) > 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum goals per employee is 8. You have {len(goals)} goals."
            )
            
        total_weightage = sum(g.weightage for g in goals)
        if total_weightage != 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Total weightage must equal exactly 100%. Current sum: {total_weightage}%."
            )
            
        for g in goals:
            if g.weightage < 10:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Goal '{g.title}' has weightage {g.weightage}%. Minimum weightage per goal is 10%."
                )

    @staticmethod
    def create_goal(db: Session, goal_in: GoalCreate, employee_id: int) -> Goal:
        # Check active draft count
        draft_count = db.query(Goal).filter(
            Goal.employee_id == employee_id,
            Goal.status == "Draft"
        ).count()
        
        # Total goals (Draft + Approved + Pending) shouldn't exceed 8
        total_count = db.query(Goal).filter(
            Goal.employee_id == employee_id
        ).count()
        
        if total_count >= 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum of 8 goals allowed per employee."
            )

        if goal_in.weightage < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Minimum weightage per goal is 10%."
            )

        db_goal = Goal(
            employee_id=employee_id,
            thrust_area=goal_in.thrust_area,
            title=goal_in.title,
            description=goal_in.description,
            uom=goal_in.uom,
            target=goal_in.target,
            weightage=goal_in.weightage,
            quarter=goal_in.quarter,
            status="Draft",
            locked=False
        )
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)
        
        # Initialize achievements for all 4 quarters
        for q in ["Q1", "Q2", "Q3", "Q4"]:
            db_ach = Achievement(
                goal_id=db_goal.id,
                quarter=q,
                planned_target=db_goal.target,
                actual_achievement=0.0,
                progress_status="Not Started",
                score=0.0
            )
            db.add(db_ach)
            
        db.commit()
        db.refresh(db_goal)

        AuditService.log_action(
            db, 
            user_id=employee_id, 
            action="Goal Created", 
            entity_type="Goal", 
            entity_id=db_goal.id, 
            new_value=f"Title: {db_goal.title}, Weightage: {db_goal.weightage}%"
        )
        
        return db_goal

    @staticmethod
    def update_goal(db: Session, goal_id: int, goal_in: GoalUpdate, user_id: int, is_admin: bool = False) -> Goal:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
            
        if goal.locked and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Goal is locked and cannot be edited"
            )

        old_val = f"Title: {goal.title}, Weightage: {goal.weightage}%, Target: {goal.target}"
        
        update_data = goal_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(goal, key, value)
            
        db.commit()
        db.refresh(goal)
        
        # Update corresponding planned targets in achievements if target is changed
        if "target" in update_data:
            db.query(Achievement).filter(Achievement.goal_id == goal.id).update(
                {"planned_target": goal.target}
            )
            db.commit()

        new_val = f"Title: {goal.title}, Weightage: {goal.weightage}%, Target: {goal.target}"
        
        AuditService.log_action(
            db, 
            user_id=user_id, 
            action="Goal Edited", 
            entity_type="Goal", 
            entity_id=goal.id, 
            old_value=old_val,
            new_value=new_val
        )
        
        return goal
