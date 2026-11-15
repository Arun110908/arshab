def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_register_login_me(client):
    body = {"email": "a@b.com", "name": "A", "password": "supersecret1"}
    assert client.post("/api/auth/register", json=body).status_code == 201
    assert client.post("/api/auth/register", json=body).status_code == 409
    assert client.post("/api/auth/login", json={"email": "a@b.com", "password": "wrong"}).status_code == 401
    r = client.post("/api/auth/login", json={"email": "A@B.com", "password": "supersecret1"})
    assert r.status_code == 200
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {r.json()['access_token']}"})
    assert me.json()["email"] == "a@b.com"


def test_weak_password_rejected(client):
    r = client.post("/api/auth/register", json={"email": "x@y.com", "name": "X", "password": "short"})
    assert r.status_code == 422


def test_protected_requires_token(client):
    assert client.get("/api/paths").status_code == 401


def test_prerequisite_enforced_then_unlocked(client, auth):
    topics = client.get("/api/paths", headers=auth).json()[0]["topics"]
    assert topics[1]["locked"] is True
    assert client.post("/api/lessons/2/complete", json={}, headers=auth).status_code == 403
    assert client.post("/api/lessons/1/complete", json={"seconds_spent": 120}, headers=auth).status_code == 200
    assert client.post("/api/lessons/2/complete", json={}, headers=auth).status_code == 200


def test_dashboard_from_real_data(client, auth):
    d = client.get("/api/dashboard/summary", headers=auth).json()
    assert d["lessons_completed"] == 0 and d["streak_days"] == 0
    client.post("/api/lessons/1/complete", json={"seconds_spent": 600}, headers=auth)
    d = client.get("/api/dashboard/summary", headers=auth).json()
    assert d["lessons_completed"] == 1 and d["minutes_spent"] == 10 and d["streak_days"] == 1
    assert d["paths"][0]["percent"] == 50


def test_topic_and_lesson_endpoints(client, auth):
    t = client.get("/api/topics/2", headers=auth).json()
    assert t["locked"] is True and t["requires"] == ["Variables"]
    assert client.get("/api/lessons/2", headers=auth).status_code == 403
    l = client.get("/api/lessons/1", headers=auth).json()
    assert l["title"] == "Intro" and l["completed"] is False and l["next_lesson_id"] is None
    assert client.get("/api/lessons/999", headers=auth).status_code == 404


def test_guest_session_without_login(client):
    r = client.post("/api/auth/guest")
    assert r.status_code == 201
    h = {"Authorization": "Bearer " + r.json()["access_token"]}
    assert client.get("/api/auth/me", headers=h).json()["name"] == "Learner"
    assert client.get("/api/dashboard/summary", headers=h).status_code == 200
    again = client.post("/api/auth/refresh")  # the refresh cookie restores the same guest
    assert again.status_code == 200
    assert again.json()["user"]["id"] == r.json()["user"]["id"]
