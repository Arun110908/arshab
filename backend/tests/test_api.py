def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_no_login_needed_and_auth_routes_removed(client):
    assert client.get("/api/paths").status_code == 200
    assert client.post("/api/auth/guest").status_code == 404
    assert client.post("/api/auth/login", json={}).status_code == 404


def test_prerequisite_enforced_then_unlocked(client):
    topics = client.get("/api/paths").json()[0]["topics"]
    assert topics[1]["locked"] is True
    assert client.post("/api/lessons/2/complete", json={}).status_code == 403
    assert client.post("/api/lessons/1/complete", json={"seconds_spent": 120}).status_code == 200
    assert client.post("/api/lessons/2/complete", json={}).status_code == 200


def test_dashboard_from_real_data(client):
    d = client.get("/api/dashboard/summary").json()
    assert d["lessons_completed"] == 0 and d["streak_days"] == 0
    client.post("/api/lessons/1/complete", json={"seconds_spent": 600})
    d = client.get("/api/dashboard/summary").json()
    assert d["lessons_completed"] == 1 and d["minutes_spent"] == 10 and d["streak_days"] == 1
    assert d["paths"][0]["percent"] == 50


def test_progress_is_shared_by_every_request(client):
    client.post("/api/lessons/1/complete", json={})
    other = client.get("/api/topics/1").json()  # a fresh request sees the same progress
    assert other["lessons"][0]["completed"] is True


def test_topic_and_lesson_endpoints(client):
    t = client.get("/api/topics/2").json()
    assert t["locked"] is True and t["requires"] == ["Variables"]
    assert client.get("/api/lessons/2").status_code == 403
    l = client.get("/api/lessons/1").json()
    assert l["title"] == "Intro" and l["completed"] is False and l["next_lesson_id"] is None
    assert client.get("/api/lessons/999").status_code == 404
