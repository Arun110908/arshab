# ARSHAB – Backend (Phase 3 skeleton)

FastAPI + SQLAlchemy 2 + PostgreSQL. Works on Python 3.9+. Implemented: auth (Argon2, JWT access + httpOnly refresh cookie),
roles, learning paths with prerequisite-based unlocking, lesson completion, dashboard stats derived from real events, health check.

## Run locally (macOS / zsh)
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # set JWT_SECRET; SQLite is used if DATABASE_URL is unset
uvicorn app.main:app --reload
```
Docs: http://localhost:8000/docs

## Test
```bash
pytest -q
```


```

## Not done yet
Quizzes, AI assistant, sandbox runner, admin API, password reset email, Alembic migrations, content seeding.
