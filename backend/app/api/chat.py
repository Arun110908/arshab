from typing import Optional

import json
import time
import threading
import urllib.request
import urllib.error

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from ..core.config import settings

router = APIRouter(prefix="/api", tags=["arsha"])
_rate = {}
_lock = threading.Lock()

SYSTEM_PROMPT = """
You are Arsha, the friendly AI learning assistant inside ARSHAB.
Teach Python, JavaScript, programming fundamentals, web development,
debugging, and computer science. Explain concepts clearly for beginners.
Use short examples and explain important lines. Help learners understand
their code rather than just giving unexplained answers. Be accurate,
encouraging, respectful, and never claim code was executed if it was not.
"""

class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    interaction_id: Optional[str] = Field(default=None, max_length=200)

def allow_request(ip):
    now = time.time()
    with _lock:
        recent = [t for t in _rate.get(ip, []) if now - t < 60]
        if len(recent) >= 10:
            return False
        recent.append(now)
        _rate[ip] = recent
        return True

def extract_reply(data):
    if isinstance(data.get("output_text"), str):
        return data["output_text"].strip()
    parts = []
    for step in data.get("steps", []):
        if step.get("type") == "model_output":
            for item in step.get("content", []):
                if item.get("type") == "text" and item.get("text"):
                    parts.append(item["text"])
    return "\n".join(parts).strip()

@router.post("/chat")
def arsha_chat(body: ChatIn, request: Request):
    ip = request.client.host if request.client else "unknown"
    if not allow_request(ip):
        raise HTTPException(429, "Please wait before sending another message.")

    key = settings.gemini_api_key
    model = settings.gemini_model
    if not key:
        raise HTTPException(503, "Arsha AI is not configured.")

    payload = {
        "model": model,
        "input": body.message.strip(),
        "system_instruction": SYSTEM_PROMPT
    }
    if body.interaction_id:
        payload["previous_interaction_id"] = body.interaction_id

    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        data=json.dumps(payload).encode(),
        method="POST",
        headers={
            "x-goog-api-key": key,
            "Content-Type": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            result = json.loads(response.read().decode())
        reply = extract_reply(result)
        if not reply:
            raise HTTPException(502, "Arsha returned an empty response.")
        return {
            "name": "Arsha",
            "reply": reply,
            "interaction_id": result.get("id")
        }
    except urllib.error.HTTPError as e:
        print("Gemini HTTP error:", e.code, e.read().decode(errors="replace")[:500])
        raise HTTPException(502, "Arsha AI service is temporarily unavailable.")
    except (urllib.error.URLError, TimeoutError):
        raise HTTPException(502, "Could not connect to the AI service.")
