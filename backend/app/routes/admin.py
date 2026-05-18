from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.security import check_role
from app.models.user import User
from app.models.goal import Goal
from app.models.achievement import Achievement
from app.models.audit import AuditLog
from app.schemas.goal import GoalResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard")
def get_admin_dashboard_data(
    current_user: User = Depends(check_role(["admin"])),
    db: Session = Depends(get_db)
):
    # Total Users
    total_users = db.query(User).count()
    employee_count = db.query(User).filter(User.role == "employee").count()
    manager_count = db.query(User).filter(User.role == "manager").count()
    
    # Goal Status Distribution
    status_counts = db.query(Goal.status, func.count(Goal.id)).group_by(Goal.status).all()
    status_dist = {s[0]: s[1] for s in status_counts}
    for default_status in ["Draft", "Pending Approval", "Approved", "Rejected"]:
        if default_status not in status_dist:
            status_dist[default_status] = 0
            
    # Organization Goal Completion % (average score of all Q achievements of approved goals)
    avg_score = db.query(func.avg(Achievement.score)).join(Goal, Goal.id == Achievement.goal_id).filter(
        Goal.status == "Approved"
    ).scalar()
    org_completion_rate = round(avg_score, 2) if avg_score is not None else 0.0
    
    # Pending approvals count
    pending_approvals = status_dist.get("Pending Approval", 0)
    
    # Thrust Area (Department Summary)
    thrust_summary = []
    thrust_data = (
        db.query(Goal.thrust_area, func.count(Goal.id), func.avg(Achievement.score))
        .join(Achievement, Achievement.goal_id == Goal.id)
        .group_by(Goal.thrust_area)
        .all()
    )
    for row in thrust_data:
        thrust_summary.append({
            "thrust_area": row[0],
            "goal_count": row[1],
            "average_score": round(row[2], 2) if row[2] is not None else 0.0
        })
        
    # Quarterly completion trends
    quarter_trends = []
    quarter_data = (
        db.query(Achievement.quarter, func.avg(Achievement.score))
        .join(Goal, Goal.id == Achievement.goal_id)
        .filter(Goal.status == "Approved")
        .group_by(Achievement.quarter)
        .all()
    )
    quarter_dict = {q[0]: round(q[1], 2) if q[1] is not None else 0.0 for q in quarter_data}
    for q in ["Q1", "Q2", "Q3", "Q4"]:
        quarter_trends.append({
            "quarter": q,
            "average_score": quarter_dict.get(q, 0.0)
        })

    # Goal distribution detail
    goal_dist = []
    for k, v in status_dist.items():
        goal_dist.append({"status": k, "count": v})

    return {
        "metrics": {
            "total_users": total_users,
            "employee_count": employee_count,
            "manager_count": manager_count,
            "org_completion_rate": org_completion_rate,
            "pending_approvals": pending_approvals
        },
        "status_distribution": goal_dist,
        "department_summary": thrust_summary,
        "quarterly_trends": quarter_trends
    }

@router.put("/unlock/{goal_id}", response_model=GoalResponse)
def unlock_goal(
    goal_id: int,
    current_user: User = Depends(check_role(["admin"])),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    old_val = f"Locked: {goal.locked}, Status: {goal.status}"
    
    goal.locked = False
    goal.status = "Draft"  # Revert to Draft so employee can edit
    db.commit()
    db.refresh(goal)
    
    AuditService.log_action(
        db,
        user_id=current_user.id,
        action="Goal Unlocked",
        entity_type="Goal",
        entity_id=goal.id,
        old_value=old_val,
        new_value=f"Locked: {goal.locked}, Status: {goal.status}"
    )
    
    return goal

@router.get("/audit-logs")
def get_audit_logs(
    current_user: User = Depends(check_role(["admin"])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog, User).join(User, User.id == AuditLog.user_id).order_by(
        AuditLog.timestamp.desc()
    ).all()
    
    formatted_logs = []
    for log, user in logs:
        formatted_logs.append({
            "id": log.id,
            "user_name": user.name,
            "user_email": user.email,
            "user_role": user.role,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "timestamp": log.timestamp
        })
    return formatted_logs
