# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.goal import Goal
from app.models.achievement import Achievement
from app.services.goal_service import GoalService

def seed_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if users already exist
        admin_user = db.query(User).filter(User.email == "admin@test.com").first()
        if admin_user:
            print("Database already seeded.")
            return

        print("Seeding database...")
        
        # 1. Create Users
        admin = User(
            name="Alice HR Admin",
            email="admin@test.com",
            password=get_password_hash("password123"),
            role="admin"
        )
        db.add(admin)
        
        manager = User(
            name="Bob L1 Manager",
            email="manager@test.com",
            password=get_password_hash("password123"),
            role="manager"
        )
        db.add(manager)
        db.commit()
        db.refresh(manager)
        
        employee1 = User(
            name="Kushagra Employee",
            email="employee@test.com",
            password=get_password_hash("password123"),
            role="employee",
            manager_id=manager.id
        )
        db.add(employee1)
        
        employee2 = User(
            name="Jane Subordinate",
            email="employee2@test.com",
            password=get_password_hash("password123"),
            role="employee",
            manager_id=manager.id
        )
        db.add(employee2)
        db.commit()
        db.refresh(employee1)
        db.refresh(employee2)

        # 2. Add some seed goals & achievements for Employee 1 (Kushagra Employee)
        g1 = Goal(
            employee_id=employee1.id,
            thrust_area="Technology",
            title="Implement Hackathon Portal",
            description="Build full-stack PMS system with React, FastAPI, SQLite",
            uom="percentage",
            target=100.0,
            weightage=30,
            quarter="Q1",
            status="Approved",
            locked=True
        )
        db.add(g1)
        
        g2 = Goal(
            employee_id=employee1.id,
            thrust_area="Operations",
            title="Reduce Server Latency",
            description="Optimize DB queries and cache static assets",
            uom="timeline",
            target=150.0, # 150ms deadline
            weightage=20,
            quarter="Q1",
            status="Approved",
            locked=True
        )
        db.add(g2)
        
        g3 = Goal(
            employee_id=employee1.id,
            thrust_area="Sales",
            title="Acquire New Clients",
            description="Close at least 5 major enterprise accounts",
            uom="numeric",
            target=5.0,
            weightage=25,
            quarter="Q1",
            status="Pending Approval",
            locked=False
        )
        db.add(g3)
        
        g4 = Goal(
            employee_id=employee1.id,
            thrust_area="HR",
            title="Conduct Skill Workshops",
            description="Train team in Python, React, and FastAPI basics",
            uom="zero-based",
            target=0.0, # 0 failures is target
            weightage=25,
            quarter="Q1",
            status="Draft",
            locked=False
        )
        db.add(g4)
        
        db.commit()
        db.refresh(g1)
        db.refresh(g2)
        db.refresh(g3)
        db.refresh(g4)

        # Seed achievements for Kushagra Employee
        # G1: Approved Goal
        for q in ["Q1", "Q2", "Q3", "Q4"]:
            ach = Achievement(
                goal_id=g1.id,
                quarter=q,
                planned_target=g1.target,
                actual_achievement=95.0 if q == "Q1" else 0.0,
                progress_status="Completed" if q == "Q1" else "Not Started",
                score=GoalService.calculate_progress_score(g1.uom, g1.target, 95.0) if q == "Q1" else 0.0,
                employee_comment="Portal built successfully with great test coverage!" if q == "Q1" else None,
                manager_comment="Excellent work, exceeded expectations in speed!" if q == "Q1" else None,
                checkin_date=g1.created_at if q == "Q1" else None
            )
            db.add(ach)
            
        # G2: Approved Goal
        for q in ["Q1", "Q2", "Q3", "Q4"]:
            ach = Achievement(
                goal_id=g2.id,
                quarter=q,
                planned_target=g2.target,
                actual_achievement=120.0 if q == "Q1" else 0.0, # actual latency 120ms (less than 150ms deadline, so score 100)
                progress_status="Completed" if q == "Q1" else "Not Started",
                score=GoalService.calculate_progress_score(g2.uom, g2.target, 120.0) if q == "Q1" else 0.0,
                employee_comment="Latency reduced to 120ms using Redis." if q == "Q1" else None,
                manager_comment="Fast load times!" if q == "Q1" else None,
                checkin_date=g2.created_at if q == "Q1" else None
            )
            db.add(ach)

        # G3: Pending Goal
        for q in ["Q1", "Q2", "Q3", "Q4"]:
            ach = Achievement(
                goal_id=g3.id,
                quarter=q,
                planned_target=g3.target,
                actual_achievement=0.0,
                progress_status="Not Started",
                score=0.0
            )
            db.add(ach)

        # G4: Draft Goal
        for q in ["Q1", "Q2", "Q3", "Q4"]:
            ach = Achievement(
                goal_id=g4.id,
                quarter=q,
                planned_target=g4.target,
                actual_achievement=0.0,
                progress_status="Not Started",
                score=0.0
            )
            db.add(ach)

        # 3. Sample goals for Employee 2 (Jane Subordinate)
        g5 = Goal(
            employee_id=employee2.id,
            thrust_area="Sales",
            title="Q1 Sales Expansion",
            description="Achieve $50k in regional direct sales",
            uom="numeric",
            target=50000.0,
            weightage=100,
            quarter="Q1",
            status="Approved",
            locked=True
        )
        db.add(g5)
        db.commit()
        db.refresh(g5)

        for q in ["Q1", "Q2", "Q3", "Q4"]:
            ach = Achievement(
                goal_id=g5.id,
                quarter=q,
                planned_target=g5.target,
                actual_achievement=45000.0 if q == "Q1" else 0.0,
                progress_status="On Track" if q == "Q1" else "Not Started",
                score=GoalService.calculate_progress_score(g5.uom, g5.target, 45000.0) if q == "Q1" else 0.0,
                employee_comment="Almost hit target! Close to closing a large deal." if q == "Q1" else None,
                manager_comment="Great effort, keep pushing." if q == "Q1" else None,
                checkin_date=g5.created_at if q == "Q1" else None
            )
            db.add(ach)

        db.commit()
        print("Database seeded successfully with premium test data!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
