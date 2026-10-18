import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Form
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from groq import Groq

from signals import detect_signals, contains_link, requests_install

load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
PRIMARY_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
FALLBACK_MODEL = os.environ.get("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")
VISION_MODEL = os.environ.get("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

client = Groq(api_key=GROQ_API_KEY)

app = FastAPI()

# Languages gpt-oss-120b / llama-3.3-70b reliably read, understand, and write in -
# trimmed to only the highest-resource languages these open-weight models handle
# well, not every language they can technically attempt.
SUPPORTED_LANGUAGES = [
    "English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi",
    "Spanish", "French", "German", "Portuguese", "Arabic",
    "Chinese (Simplified)", "Russian",
]

SYSTEM_PROMPT = """You are the detection engine inside Tellsign, a tool that helps ordinary people tell whether a message they received is a scam.

You will be given one message (an SMS, email, WhatsApp text, or call transcript). A rule engine has already \
flagged some pattern matches in it - use those as hints, not gospel: confirm, downgrade, or add to them based \
on your own reading of the actual content and context. You will also be told an OUTPUT LANGUAGE and a READING \
LEVEL to write your response in.

Analyse for real manipulation tactics: urgency and pressure, impersonating a bank or authority, threats of \
account/legal consequences, requests for OTP/PIN/payment/personal details, offers too good to be true, \
suspicious or shortened links, requests to install an app or file, and any other genuine deception tactic.

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{
  "verdict": "safe" | "caution" | "danger",
  "verdict_label": "a short label naming the verdict for display (meaning 'Looks safe' / 'Proceed with caution' / 'Likely a scam'), written in the OUTPUT LANGUAGE",
  "summary": "one short plain-language sentence explaining the overall verdict, in the OUTPUT LANGUAGE and READING LEVEL",
  "recommended_action": "one concrete, specific next step the person should take right now, in the OUTPUT LANGUAGE and READING LEVEL",
  "findings": [
    { "tag": "short 2-4 word category name, in the OUTPUT LANGUAGE", "quote": "the exact phrase from the ORIGINAL message that triggered this - never translate this field, copy it verbatim", "explain": "one plain-language sentence on why this is a red flag, in the OUTPUT LANGUAGE and READING LEVEL" }
  ],
  "safety_lines": {
    "never_share": "translate into the OUTPUT LANGUAGE: Never share your OTP, PIN, password, or CVV with anyone - your bank will never ask for this.",
    "no_click": "translate into the OUTPUT LANGUAGE: Do not click the link in this message.",
    "no_install": "translate into the OUTPUT LANGUAGE: Do not install any app or file from this message - it could damage your device or steal your data.",
    "verify_official": "translate into the OUTPUT LANGUAGE: If you think it might be real, contact the company directly using a number from their official website or the back of your card - not from this message."
  }
}

Always populate all four safety_lines fields regardless of verdict - the app decides which ones to display. \
Only include a finding if there is a genuine, specific tactic present - do not pad the list. If the message is \
ordinary and shows no manipulation tactics, return "verdict": "safe", a reassuring one-line "summary", a \
"recommended_action" appropriate to a safe message (e.g. "No action needed", translated), and an empty \
"findings" array. Use "caution" for messages with 1-2 mild signals, and "danger" for messages with clear, \
multiple, or severe manipulation tactics.

READING LEVEL "simple" means: very short sentences, everyday words, no jargon, written for someone who is new \
to smartphones or not fluent in reading long text. READING LEVEL "normal" means ordinary plain language."""


# ---------------------------------------------------------------------------
# Supabase REST helpers (PostgREST)
# ---------------------------------------------------------------------------


def _sb_headers(prefer: str | None = None) -> dict:
    h = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        h["Prefer"] = prefer
    return h


def sb_select(table: str, params: dict) -> list[dict]:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}", headers=_sb_headers(), params=params, timeout=10)
    r.raise_for_status()
    return r.json()


def sb_insert(table: str, row: dict) -> dict:
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}", headers=_sb_headers("return=representation"), json=row, timeout=10
    )
    r.raise_for_status()
    return r.json()[0]


def sb_update(table: str, match: dict, patch: dict) -> None:
    params = {k: f"eq.{v}" for k, v in match.items()}
    r = requests.patch(f"{SUPABASE_URL}/rest/v1/{table}", headers=_sb_headers(), params=params, json=patch, timeout=10)
    r.raise_for_status()


TRANSLATION_CACHE: dict = {}


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", "", (text or "").lower())).strip()


def stripped_json(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.lower().startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def build_user_content(message_text: str, signals: list, language: str, reading_level: str) -> str:
    signal_lines = "\n".join(f"- {s['label']}" for s in signals) or "- none detected"
    return (
        f"Message:\n\"\"\"\n{message_text}\n\"\"\"\n\n"
        f"Rule engine flagged:\n{signal_lines}\n\n"
        f"OUTPUT LANGUAGE: {language}\n"
        f"READING LEVEL: {reading_level}"
    )


def rule_only_result(signals: list) -> dict:
    """Degraded, AI-unavailable fallback built purely from the deterministic rule engine."""
    verdict = "danger" if len(signals) >= 3 else ("caution" if signals else "safe")
    findings = [
        {"tag": s["label"], "quote": "", "explain": f"Pattern-matched by the rule engine: {s['label']}."}
        for s in signals
    ]
    return {
        "verdict": verdict,
        "verdict_label": {"safe": "Looks safe", "caution": "Proceed with caution", "danger": "Likely a scam"}[verdict],
        "summary": "AI analysis is temporarily unavailable, so this result is from pattern-matching rules only.",
        "recommended_action": "Treat this as a lower-confidence result. If in doubt, verify directly with the sender through an official channel.",
        "findings": findings,
        "safety_lines": {
            "never_share": "Never share your OTP, PIN, password, or CVV with anyone - your bank will never ask for this.",
            "no_click": "Do not click the link in this message.",
            "no_install": "Do not install any app or file from this message - it could damage your device or steal your data.",
            "verify_official": "If you think it might be real, contact the company directly using a number from their official website or the back of your card - not from this message.",
        },
        "_model_used": "rule-engine-only",
        "_degraded": True,
    }


def call_groq_text(message_text: str, signals: list, language: str = "English", reading_level: str = "normal") -> dict:
    user_content = build_user_content(message_text, signals, language, reading_level)
    last_error = None
    for model in (PRIMARY_MODEL, FALLBACK_MODEL):
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            data = stripped_json(completion.choices[0].message.content)
            data["_model_used"] = model
            data["_degraded"] = False
            return data
        except Exception as e:
            last_error = e
    # Both models failed - degrade gracefully instead of erroring out the whole scan.
    result = rule_only_result(signals)
    result["_error"] = str(last_error)
    return result


def ocr_image(data_url: str) -> str:
    """Reads text out of a screenshot using Groq's vision model directly, instead
    of a local Tesseract binary - Tesseract needs an OS-level install that a
    serverless deployment target doesn't have, so this reads the image the same
    way a person would: by actually looking at it."""
    completion = client.chat.completions.create(
        model=VISION_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all readable text from this image, verbatim, preserving line "
                        "breaks where they appear. Return ONLY the extracted text, nothing else, "
                        "no commentary.",
                    },
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        temperature=0.0,
    )
    return (completion.choices[0].message.content or "").strip()


def log_scan(input_type, snippet, result, model_used, language, degraded) -> int:
    normalized = normalize_text(snippet)
    row = sb_insert(
        "scans",
        {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "input_type": input_type,
            "input_snippet": snippet[:500],
            "normalized_text": normalized[:500],
            "verdict": result["verdict"],
            "summary": result["summary"],
            "recommended_action": result.get("recommended_action", ""),
            "findings": json.dumps(result.get("findings", [])),
            "has_link": contains_link(snippet),
            "has_install_request": requests_install(snippet),
            "model_used": model_used,
            "language": language,
            "degraded": degraded,
        },
    )
    return row["id"]


def count_known_matches(normalized: str, exclude_id: int | None = None) -> int:
    if not normalized:
        return 0
    params = {"select": "id", "normalized_text": f"eq.{normalized}", "verdict": "neq.safe"}
    rows = sb_select("scans", params)
    if exclude_id is not None:
        rows = [r for r in rows if r["id"] != exclude_id]
    return len(rows)


class TextScanRequest(BaseModel):
    text: str
    language: str = "English"
    reading_level: str = "normal"


class ImageScanRequest(BaseModel):
    image: str  # data URL
    language: str = "English"
    reading_level: str = "normal"


def finalize_scan(input_type: str, message_text: str, language: str, reading_level: str):
    signals = detect_signals(message_text)
    result = call_groq_text(message_text, signals, language, reading_level)

    model_used = result.pop("_model_used", PRIMARY_MODEL)
    degraded = result.pop("_degraded", False)
    result.pop("_error", None)

    row_id = log_scan(input_type, message_text, result, model_used, language, degraded)
    normalized = normalize_text(message_text)
    known_matches = count_known_matches(normalized, exclude_id=row_id)

    return {
        "id": row_id,
        "verdict": result["verdict"],
        "verdict_label": result.get("verdict_label", result["verdict"]),
        "summary": result["summary"],
        "recommended_action": result.get("recommended_action", ""),
        "findings": result.get("findings", []),
        "safety_lines": result.get("safety_lines", {}),
        "has_link": bool(contains_link(message_text)),
        "has_install_request": bool(requests_install(message_text)),
        "degraded": degraded,
        "known_matches": known_matches,
    }


@app.post("/api/scan")
async def scan_text(req: TextScanRequest):
    message_text = req.text.strip()
    if not message_text:
        return JSONResponse({"error": "No message provided."}, status_code=400)
    return finalize_scan("text", message_text, req.language, req.reading_level)


@app.post("/api/scan-image")
async def scan_image(req: ImageScanRequest):
    try:
        message_text = ocr_image(req.image)
    except Exception as e:
        return JSONResponse(
            {"error": f"Could not read text from the screenshot. Details: {e}"},
            status_code=500,
        )

    if not message_text:
        return JSONResponse(
            {"error": "No readable text was found in that screenshot. Try a clearer or higher-resolution image."},
            status_code=400,
        )

    response = finalize_scan("screenshot", message_text, req.language, req.reading_level)
    response["transcribed_text"] = message_text
    return response


@app.post("/api/feedback")
async def feedback(scan_id: int = Form(...), was_correct: str = Form(...)):
    sb_update("scans", {"id": scan_id}, {"feedback": was_correct})
    return {"ok": True}


@app.get("/api/log")
async def get_log():
    rows = sb_select(
        "scans",
        {
            "select": "id,created_at,input_type,input_snippet,verdict,summary,feedback",
            "order": "id.desc",
            "limit": "30",
        },
    )
    return rows


@app.get("/api/stats")
async def get_stats():
    rows = sb_select("scans", {"select": "verdict"})
    danger_count = sum(1 for r in rows if r["verdict"] == "danger")
    caution_count = sum(1 for r in rows if r["verdict"] == "caution")
    return {
        "total_scans": len(rows),
        "danger_count": danger_count,
        "caution_count": caution_count,
        "protected_count": danger_count + caution_count,
    }


UI_STRINGS_EN = {
    "tab_text": "Paste text",
    "tab_image": "Upload screenshot",
    "placeholder_text": "Paste the suspicious message here…",
    "scan_text_btn": "Scan message",
    "scan_image_btn": "Scan screenshot",
    "scanning": "Scanning…",
    "dropzone_main": "Drop a screenshot here or tap to browse",
    "dropzone_sub": "PNG or JPG · SMS, WhatsApp, email, or call screen",
    "remove_image": "Remove image",
    "privacy_note": "Messages are analyzed by AI and saved only to your local scan history. Never shared elsewhere.",
    "findings_head": "What we found",
    "action_head": "What to do",
    "safety_head": "Before you do anything else:",
    "feedback_q": "Was this right?",
    "yes": "Yes",
    "no": "No",
    "fb_thanks": "Thanks, saved!",
    "rescan": "Scan another message",
    "history_head": "Recent scans",
    "history_empty": "No scans yet.",
    "ex_bank": "Try: bank alert",
    "ex_delivery": "Try: delivery link",
    "ex_job": "Try: job offer",
    "ex_safe": "Try: a normal text",
    "report_btn": "Report to Cyber Crime Helpline",
    "report_call": "Call",
    "report_web": "File online at",
    "known_match_one": "This exact message has been flagged once before.",
    "known_match_many": "This exact message has been flagged {n} times before - it's a known circulating scam.",
    "degraded_note": "AI analysis was unavailable for this scan - showing a lower-confidence, rule-based result only.",
    "protected_label": "scams caught for your family",
    "read_aloud": "Read aloud",
    "reading_simple": "Explain simply",
}


@app.get("/api/ui-strings")
async def ui_strings(lang: str = "English"):
    key = lang.strip().lower()
    if key in ("english", "en", ""):
        return UI_STRINGS_EN
    if key in TRANSLATION_CACHE:
        return TRANSLATION_CACHE[key]
    try:
        prompt = (
            "Translate the VALUES of this JSON object into " + lang + ". Keep the exact same keys, "
            "including any {n} placeholders exactly as they are. Return ONLY a JSON object with the same "
            "keys and translated values, no markdown fences, no commentary.\n\n" + json.dumps(UI_STRINGS_EN)
        )
        completion = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        translated = stripped_json(completion.choices[0].message.content)
        for k, v in UI_STRINGS_EN.items():
            translated.setdefault(k, v)
        TRANSLATION_CACHE[key] = translated
        return translated
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/languages")
async def get_languages():
    return SUPPORTED_LANGUAGES


BASE_DIR = Path(__file__).parent
SECOND_LOOK_PATH = BASE_DIR / "prototype.html"
TELLSIGN_PATH = BASE_DIR / "tellsign.html"


@app.get("/", response_class=HTMLResponse)
async def index():
    return SECOND_LOOK_PATH.read_text(encoding="utf-8")


@app.get("/tellsign", response_class=HTMLResponse)
async def tellsign():
    return TELLSIGN_PATH.read_text(encoding="utf-8")
