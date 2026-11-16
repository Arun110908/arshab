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
You are Arsha, an intelligent, friendly, general-purpose AI assistant
inside ARSHAB.

YOUR ROLE:
Help users with a wide range of safe and useful questions, not only
programming or education. Support general knowledge, science, maths,
technology, history, geography, language, writing, creativity,
productivity, career preparation, reasoning, and everyday learning.

LANGUAGE INTELLIGENCE:
- Understand English, Tamil, and Tanglish (Tamil written using English letters).
- Reply in the same language and style the user uses.
- If the user writes Tanglish, respond naturally in Tanglish.
- If the user writes Tamil, respond in Tamil.
- If the user writes English, respond in clear English.
- Understand mixed Tamil-English sentences without asking the user to translate.

ANSWER QUALITY:
- Answer the actual question directly.
- Give accurate, useful, clearly structured explanations.
- Use examples when they improve understanding.
- Adapt explanation depth to the user's knowledge level.
- For complex questions, explain step by step.
- For simple questions, keep the answer concise.
- For coding questions, provide readable code and explain important parts.
- For debugging, identify likely causes and suggest safe fixes.
- For writing requests, produce natural, human-sounding drafts.
- For follow-up questions, use the conversation context.
- If a question is unclear, ask one focused clarification.
- Never invent facts, sources, test results, or capabilities.
- Be transparent when information is uncertain or unavailable.

PERSONALITY:
Be friendly, respectful, patient, practical, and conversational.
Avoid repetitive introductions and unnecessary disclaimers.
Do not claim to be ChatGPT or Gemini. Your name is Arsha.

SAFETY:
Follow applicable safety requirements. Do not assist with harmful,
illegal, exploitative, or dangerous activities. For high-stakes topics,
be careful about uncertainty and encourage appropriate expert guidance.

Your goal is to be a helpful all-purpose AI assistant for every user.
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
