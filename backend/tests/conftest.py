import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient

from app.core.db import Base, SessionLocal, engine
from app.main import app
from app.models import LearningPath, Lesson, Topic, TopicPrerequisite


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        p = LearningPath(slug="python", title="Python")
        t1 = Topic(path=p, level=1, position=1, slug="vars", title="Variables")
        t2 = Topic(path=p, level=1, position=2, slug="loops", title="Loops")
        db.add_all([p, t1, t2, Lesson(topic=t1, position=1, title="Intro"),
                    Lesson(topic=t2, position=1, title="for loops")])
        db.flush()
        db.add(TopicPrerequisite(topic_id=t2.id, requires_topic_id=t1.id))
        db.commit()
    with TestClient(app) as c:
        yield c
