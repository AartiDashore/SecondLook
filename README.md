# Tellsign: AI scam detection & protection

Paste a suspicious message (or upload a screenshot of it) and Tellsign tells you, in plain language,
whether it looks like a scam, shows the exact phrases that gave it away, says what to do next, and
lists the cyber-crime reporting contacts for your country.

**Live app:** https://tellsign-wine.vercel.app

## Features
- **Text and screenshot scanning.** Screenshots are read with a vision model on Groq.
- **Plain-language verdict** (likely scam / suspicious / looks safe) with the red-flag phrases quoted.
- **Rule engine + LLM.** A set of explicit signal rules (urgency, OTP/PIN requests, shortened links,
  app-install pushes, prize and job-offer bait, ...) feeds hints into the model's own judgment
  (`signals.py`).
- **13 languages**, a "simple mode" for easier reading, and read-aloud for people who struggle to read.
- **Country-specific reporting contacts** (e.g. India 1930 / cybercrime.gov.in).
- **Known-scam matching** so a message flagged before is recognised, plus a "Was this right?" feedback button.
- **Reliability fallback** between models if the primary one fails.

## Stack
FastAPI (Python), Groq API (`openai/gpt-oss-120b` primary, `openai/gpt-oss-20b` fallback,
`qwen/qwen3.8-27b` for images), Supabase for the scan log, plain HTML/CSS/JS front end, deployed on Vercel.

## Run it locally
```bash
pip install fastapi groq requests python-dotenv python-multipart uvicorn
cp .env.example .env     # add your own keys
uvicorn app:app --reload
```

## Files
- `app.py`: API (`/api/scan`, `/api/scan-image`, `/api/feedback`, `/api/stats`, ...)
- `signals.py`: the rule-based scam signals
- `index.html`: the whole front end
- `screenshots/`: screenshots of the live app
- `test-samples/`: example scam messages used for testing
