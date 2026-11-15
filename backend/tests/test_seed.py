from sqlalchemy import func, select

from app.core.db import Base, SessionLocal, engine
from app.models import Lesson, Topic, TopicPrerequisite
from app.seed import seed


def test_seed_loads_content_and_is_idempotent():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        first = seed(db)
        assert first["lessons"] >= 8
        n_lessons = db.scalar(select(func.count()).select_from(Lesson))
        n_prereq = db.scalar(select(func.count()).select_from(TopicPrerequisite))
        seed(db)  # run again: no duplicates
        assert db.scalar(select(func.count()).select_from(Lesson)) == n_lessons
        assert db.scalar(select(func.count()).select_from(TopicPrerequisite)) == n_prereq
        lesson = db.scalars(select(Lesson)).first()
        for key in ("explanation", "syntax", "examples", "exercises",
                    "common_mistakes", "interview_questions", "real_world"):
            assert lesson.content[key]
        assert db.scalar(select(func.count()).select_from(Topic)) >= 6
