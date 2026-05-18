from sqlalchemy.orm import Session
from app.models.audit import AuditLog

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        user_id: int,
        action: str,
        entity_type: str,
        entity_id: int,
        old_value: str = None,
        new_value: str = None
    ) -> AuditLog:
        db_log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log
