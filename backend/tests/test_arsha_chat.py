
from app.api.chat import extract_reply

def test_extract_reply_from_steps():
    data = {"steps": [{
        "type": "model_output",
        "content": [{"type": "text", "text": "Hello from Arsha"}]
    }]}
    assert extract_reply(data) == "Hello from Arsha"

def test_extract_reply_empty():
    assert extract_reply({"steps": []}) == ""

def test_extract_reply_output_text():
    assert extract_reply({"output_text": "Ready"}) == "Ready"
