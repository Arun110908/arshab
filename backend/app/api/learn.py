from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..deps import current_user
from ..models import (LearningEvent, LearningPath, Lesson, LessonProgress,
                      Topic, TopicPrerequisite, User)
from ..schemas import CompleteIn

router = APIRouter(prefix="/api", tags=["learn"])


def _completed_lesson_ids(db: Session, user_id: int) -> set[int]:
    return set(db.scalars(select(LessonProgress.lesson_id).where(LessonProgress.user_id == user_id)))


def _topic_done(topic: Topic, done: set[int]) -> bool:
    return bool(topic.lessons) and all(l.id in done for l in topic.lessons)


def _unmet_prereqs(db: Session, topic_id: int, done: set[int]) -> list[Topic]:
    req_ids = db.scalars(select(TopicPrerequisite.requires_topic_id)
                         .where(TopicPrerequisite.topic_id == topic_id)).all()
    reqs = [db.get(Topic, r) for r in req_ids]
    return [t for t in reqs if not _topic_done(t, done)]


@router.get("/paths")
def list_paths(db: Session = Depends(get_db), user: User = Depends(current_user)):
    done = _completed_lesson_ids(db, user.id)
    out = []
    for p in db.scalars(select(LearningPath)):
        topics = []
        for t in p.topics:
            topics.append({
                "id": t.id, "title": t.title, "level": t.level,
                "locked": bool(_unmet_prereqs(db, t.id, done)),
                "lessons_total": len(t.lessons),
                "lessons_done": sum(1 for l in t.lessons if l.id in done),
            })
        out.append({"slug": p.slug, "title": p.title, "topics": topics})
    return out


@router.get("/topics/{topic_id}")
def get_topic(topic_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    topic = db.get(Topic, topic_id)
    if not topic:
        raise HTTPException(404, "Topic not found")
    done = _completed_lesson_ids(db, user.id)
    unmet = _unmet_prereqs(db, topic.id, done)
    return {
        "id": topic.id, "title": topic.title, "level": topic.level, "path": topic.path.slug,
        "locked": bool(unmet), "requires": [t.title for t in unmet],
        "lessons": [{"id": l.id, "title": l.title, "completed": l.id in done} for l in topic.lessons],
    }


@router.get("/lessons/{lesson_id}")
def get_lesson(lesson_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    done = _completed_lesson_ids(db, user.id)
    if _unmet_prereqs(db, lesson.topic_id, done):
        raise HTTPException(403, "Complete the prerequisite topics first")
    siblings = lesson.topic.lessons
    idx = next(i for i, l in enumerate(siblings) if l.id == lesson.id)
    next_id = siblings[idx + 1].id if idx + 1 < len(siblings) else None
    return {
        "id": lesson.id, "title": lesson.title, "topic_id": lesson.topic_id,
        "topic_title": lesson.topic.title, "completed": lesson.id in done,
        "next_lesson_id": next_id, "content": lesson.content,
    }


@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(lesson_id: int, body: CompleteIn, db: Session = Depends(get_db),
                    user: User = Depends(current_user)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    done = _completed_lesson_ids(db, user.id)
    if _unmet_prereqs(db, lesson.topic_id, done):
        raise HTTPException(403, "Complete the prerequisite topics first")
    if lesson_id not in done:
        db.add(LessonProgress(user_id=user.id, lesson_id=lesson_id, seconds_spent=body.seconds_spent))
        db.add(LearningEvent(user_id=user.id, kind="lesson_completed", seconds=body.seconds_spent))
        db.commit()
    return {"completed": True}


@router.get("/dashboard/summary")
def dashboard(db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Every number here is computed from the user's rows; nothing is hardcoded."""
    done = _completed_lesson_ids(db, user.id)
    per_path, total_lessons = [], 0
    for p in db.scalars(select(LearningPath)):
        ids = [l.id for t in p.topics for l in t.lessons]
        total_lessons += len(ids)
        n = sum(1 for i in ids if i in done)
        per_path.append({"slug": p.slug, "total": len(ids), "completed": n,
                         "percent": round(100 * n / len(ids)) if ids else 0})
    # Streak is counted in UTC days to match how events are stored.
    days = {date.fromisoformat(str(d)) for d in db.scalars(
        select(func.date(LearningEvent.created_at)).where(LearningEvent.user_id == user.id))}
    streak, cur = 0, date.today()
    if cur not in days:
        cur -= timedelta(days=1)
    while cur in days:
        streak += 1
        cur -= timedelta(days=1)
    seconds = db.scalar(select(func.coalesce(func.sum(LearningEvent.seconds), 0))
                        .where(LearningEvent.user_id == user.id))
    return {
        "lessons_completed": len(done), "lessons_total": total_lessons,
        "overall_percent": round(100 * len(done) / total_lessons) if total_lessons else 0,
        "paths": per_path, "streak_days": streak, "minutes_spent": round(seconds / 60),
    }
