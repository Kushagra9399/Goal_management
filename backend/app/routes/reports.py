from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse

from app.core.database import get_db
from app.core.security import check_role
from app.models.user import User
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/export/csv")
def export_csv(
    current_user: User = Depends(check_role(["admin", "manager"])),
    db: Session = Depends(get_db)
):
    csv_buffer = ReportService.generate_csv(db)
    
    headers = {
        'Content-Disposition': 'attachment; filename="goal_setting_report.csv"'
    }
    return StreamingResponse(
        csv_buffer, 
        media_type="text/csv", 
        headers=headers
    )

@router.get("/export/excel")
def export_excel(
    current_user: User = Depends(check_role(["admin", "manager"])),
    db: Session = Depends(get_db)
):
    excel_buffer = ReportService.generate_excel(db)
    
    headers = {
        'Content-Disposition': 'attachment; filename="goal_setting_report.xlsx"'
    }
    return StreamingResponse(
        excel_buffer, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        headers=headers
    )
