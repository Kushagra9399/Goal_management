import io
import pandas as pd
from sqlalchemy.orm import Session
from app.models.goal import Goal
from app.models.achievement import Achievement
from app.models.user import User

class ReportService:
    @staticmethod
    def get_report_data(db: Session) -> list[dict]:
        # Join user, goals, and achievements
        results = (
            db.query(User, Goal, Achievement)
            .join(Goal, Goal.employee_id == User.id)
            .join(Achievement, Achievement.goal_id == Goal.id)
            .all()
        )
        
        data = []
        for user, goal, ach in results:
            data.append({
                "Employee Name": user.name,
                "Employee Email": user.email,
                "Role": user.role,
                "Thrust Area": goal.thrust_area,
                "Goal Title": goal.title,
                "Goal Description": goal.description or "",
                "UoM": goal.uom,
                "Goal Status": goal.status,
                "Quarter": ach.quarter,
                "Planned Target": ach.planned_target,
                "Actual Achievement": ach.actual_achievement if ach.actual_achievement is not None else 0.0,
                "Progress Status": ach.progress_status,
                "Progress Score (%)": ach.score,
                "Weightage (%)": goal.weightage,
                "Employee Comment": ach.employee_comment or "",
                "Manager Comment": ach.manager_comment or "",
                "Goal Locked": "Yes" if goal.locked else "No"
            })
        return data

    @classmethod
    def generate_csv(cls, db: Session) -> io.BytesIO:
        data = cls.get_report_data(db)
        df = pd.DataFrame(data)
        
        # If empty, create empty template
        if df.empty:
            df = pd.DataFrame(columns=[
                "Employee Name", "Employee Email", "Role", "Thrust Area", 
                "Goal Title", "Goal Description", "UoM", "Goal Status", 
                "Quarter", "Planned Target", "Actual Achievement", 
                "Progress Status", "Progress Score (%)", "Weightage (%)", 
                "Employee Comment", "Manager Comment", "Goal Locked"
            ])
            
        csv_buffer = io.BytesIO()
        df.to_csv(csv_buffer, index=False, encoding="utf-8")
        csv_buffer.seek(0)
        return csv_buffer

    @classmethod
    def generate_excel(cls, db: Session) -> io.BytesIO:
        data = cls.get_report_data(db)
        df = pd.DataFrame(data)
        
        # If empty, create empty template
        if df.empty:
            df = pd.DataFrame(columns=[
                "Employee Name", "Employee Email", "Role", "Thrust Area", 
                "Goal Title", "Goal Description", "UoM", "Goal Status", 
                "Quarter", "Planned Target", "Actual Achievement", 
                "Progress Status", "Progress Score (%)", "Weightage (%)", 
                "Employee Comment", "Manager Comment", "Goal Locked"
            ])
            
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Goal_Tracking_Report")
            
        excel_buffer.seek(0)
        return excel_buffer
