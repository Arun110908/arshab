"""Load curriculum from backend/content/*.json into the database. Safe to re-run (idempotent).

Usage: python -m app.seed
"""
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .core.db import Base, SessionLocal, engine
from .models import LearningPath, Lesson, Topic, TopicPrerequisite

CONTENT_DIR = Path(__file__).resolve().parents[1] / "content"


def seed(db: Session, content_dir: Path = CONTENT_DIR) -> dict[str, int]:
    counts = {"topics": 0, "lessons": 0}
    for f in sorted(content_dir.glob("*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        path = db.scalar(select(LearningPath).where(LearningPath.slug == data["slug"]))
        if not path:
            path = LearningPath(slug=data["slug"], title=data["title"])
            db.add(path)
        path.title = data["title"]
        db.flush()

        by_slug: dict[str, Topic] = {}
        for ti, t in enumerate(data["topics"], start=1):
            topic = db.scalar(select(Topic).where(Topic.path_id == path.id, Topic.slug == t["slug"]))
            if not topic:
                topic = Topic(path_id=path.id, slug=t["slug"], level=t["level"], position=ti, title=t["title"])
                db.add(topic)
            topic.title, topic.level, topic.position = t["title"], t["level"], ti
            db.flush()
            by_slug[t["slug"]] = topic
            counts["topics"] += 1

            for li, l in enumerate(t["lessons"], start=1):
                lesson = db.scalar(select(Lesson).where(Lesson.topic_id == topic.id, Lesson.position == li))
                if not lesson:
                    lesson = Lesson(topic_id=topic.id, position=li, title=l["title"], content=l["content"])
                    db.add(lesson)
                lesson.title, lesson.content = l["title"], l["content"]
                counts["lessons"] += 1

        for t in data["topics"]:
            for req in t["requires"]:
                a, b = by_slug[t["slug"]].id, by_slug[req].id
                if not db.get(TopicPrerequisite, (a, b)):
                    db.add(TopicPrerequisite(topic_id=a, requires_topic_id=b))
    db.commit()
    return counts


if __name__ == "__main__":
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        print("Seeded:", seed(session))
