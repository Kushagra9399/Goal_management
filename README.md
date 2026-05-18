# 🎯 AtomQuest — In-House Goal Setting & Tracking Portal

AtomQuest is a premium full-stack performance management system (PMS) built as a high-end, production-like MVP for goal setting, alignment, and quarterly appraisal tracking.

It solves organization-wide goal governance bottlenecks by providing direct employee-to-manager alignment workflows, automated performance index computations based on Units of Measurement (UoM), dynamic HR admin control panels, and automated Excel/CSV audit export services.

---

## 🚀 Tech Stack

* **Frontend**: React + Vite
* **Backend**: FastAPI (Python)
* **Database**: SQLite (local single-file datastore, zero setup friction!)
* **ORM**: SQLAlchemy
* **Styling**: TailwindCSS v4 (integrated with `@tailwindcss/vite`)
* **State Management**: React Context API
* **API Communication**: Axios (with automatic JWT authentication injection)
* **Authentication**: JWT-based token signing with hashed passwords (passlib/bcrypt)
* **Charts**: Recharts (Pie charts, area progression trends, department metrics)
* **Export Utilities**: pandas, openpyxl, raw UTF-8 CSVs

---

## 🛠️ Folder Structure

```
atomberg/
├── backend/
│   ├── app/
│   │   ├── core/           # DB session configuration, JWT helper schemas
│   │   ├── models/         # SQLAlchemy schemas (User, Goal, Achievement, AuditLog)
│   │   ├── schemas/        # Pydantic schemas (validations, payload controls)
│   │   ├── routes/         # REST API routers (Auth, Goals, Manager, Admin, Reports)
│   │   ├── services/       # Core business logic (calculations, Pandas seeder)
│   │   ├── seed/           # Seeder script populated with premium demo records
│   │   └── main.py         # App bootstrap with automatic DB creation & seeding
│   ├──requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API config
│   │   ├── components/     # Layout (Sidebar, Navbar), common modals
│   │   ├── context/        # AuthSession Context Provider
│   │   ├── pages/          # Auth, Employee, Manager, Admin dashboards
│   │   ├── routes/         # Protected role-based route wrappers
│   │   ├── App.jsx         # App routes mapping
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
```

---

## 🔐 Demo Credentials

Use these one-click buttons in the login screen, or sign in manually using:

| Role | Email | Password |
|---|---|---|
| **Employee (Kushagra Employee)** | `employee@test.com` | `password123` |
| **Manager L1 (Bob L1 Manager)** | `manager@test.com` | `password123` |
| **HR Admin (Alice HR Admin)** | `admin@test.com` | `password123` |

---

## ⭐ Key Modules & Core Logic

### 1. Goal Setting & Governance (Employee)
* Employees can create up to **8 goals** in a draft state.
* **Weightage Rule**: All draft goals combined must add up to **exactly 100%**, and each goal must hold a minimum weightage of **10%**. (Validated both in frontend forms and FastAPI services!).
* Once submitted, goals transition to `Pending Approval`.

### 2. Double-Ended Actions (Manager)
* Managers view direct subordinates' goals side-by-side.
* Managers can edit weightages and target values inline before final approval.
* Approved goals transition to `Approved` and are **locked** instantly (no further employee edits).

### 3. Computations (Quarterly Appraisal Index)
Achievements scores are calculated dynamically based on the goal's UoM:
1. **Numeric / Percentage**: `(achievement / target) * 100` (higher is better)
2. **Timeline / Max Type**: If actual completion/achievement is $\le$ target (completed under deadline), score is **100%**, else **0%**.
3. **Zero-Based**: If achievement is exactly **0** (e.g. 0 incidents), score is **100%**, else **0%**.

### 4. Admin controls & Export Center
* Admins can view complete system audit logs tracking goal updates, check-ins, and user actions.
* Admins can **unlock** any goal, reverting it to draft state.
* Download formatted, high-quality **Excel Spreadsheets (XLSX)** and **CSVs** populated with org-wide achievement logs using Pandas and openpyxl!

---

## ⚡ Setup & Run Instructions

### 1. Start the Backend API
Navigate to the `backend` folder, set up your virtual environment, install requirements, and run the Uvicorn server:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*Note: The SQLite database `goal_portal.db` will be created automatically in `backend/` and pre-populated with premium sample goals, team structures, and quarterly check-ins on startup!*

### 2. Start the Frontend Dev Server
In a separate terminal shell, navigate to the `frontend` folder, install npm packages, and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. The Vite server is configured to proxy all `/api` requests to the FastAPI backend running on port 8000!

---

## 🌐 API Reference Endpoints

### Authentication
* `POST /api/auth/login` - JSON JWT login token generator
* `GET /api/auth/me` - Fetch details for current authorized session

### Goal Management (Employee)
* `GET /api/goals` - Fetch goals for the authenticated employee
* `POST /api/goals` - Create a goal in Draft state
* `PUT /api/goals/{id}` - Edit a draft goal
* `DELETE /api/goals/{id}` - Delete a draft goal
* `POST /api/goals/submit` - Batch submit draft goals for review (triggers weightage validation)

### Quarterly Achievement Updates
* `POST /api/goals/achievements` - Save achievement values (calculates index scores)
* `GET /api/goals/achievements/{goal_id}` - View quarterly scores for a goal

### Appraisal & Reviews (Manager)
* `GET /api/manager/team` - List direct subordinates with completion rate averages
* `GET /api/manager/team/{id}/goals` - View detailed goal alignment for a subordinate
* `PUT /api/manager/approve/{id}` - Modify target/weight inline and approve (locks goal)
* `PUT /api/manager/reject/{id}` - Reject goal set back to draft with comments
* `POST /api/manager/check-in/{id}` - Append manager check-in comments and date

### HR Governance & Reports (Admin)
* `GET /api/admin/dashboard` - Organization-wide performance statistics & distributions
* `PUT /api/admin/unlock/{id}` - Force unlock a goal set (reverts status to Draft)
* `GET /api/admin/audit-logs` - Retrieve detailed organization-wide modification logs
* `GET /api/reports/export/csv` - Export alignment sheets as a delimited CSV
* `GET /api/reports/export/excel` - Export alignment sheets as fully styled Excel files
