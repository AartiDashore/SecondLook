# Second Look (HuskyHack 2026)

This repo deploys as one Vercel project with two pages:

| Route | What it is |
|---|---|
| `/` | **Second Look** prototype (`prototype.html`): a pause the member controls |
| `/tellsign` | **Tellsign** scam scanner (`tellsign.html`), backed by the FastAPI API in `app.py` |
| `/api/*` | Tellsign API (`/api/scan`, `/api/scan-image`, `/api/feedback`, `/api/stats`, `/api/log`, `/api/languages`, `/api/ui-strings`) |

`analysis/` (offline scoring script and synthetic data) and `deck/` (presentation slides) are not deployed.

## Tellsign: AI scam detection & protection

Paste a suspicious message (or upload a screenshot of it) and Tellsign tells you, in plain language,
whether it looks like a scam, shows the exact phrases that gave it away, says what to do next, and
lists the cyber-crime reporting contacts for your country.

Original project: https://github.com/propcgamer20-png/tellsign

### Features
- **Text and screenshot scanning.** Screenshots are read with a vision model on Groq.
- **Plain-language verdict** (likely scam / suspicious / looks safe) with the red-flag phrases quoted.
- **Rule engine + LLM.** A set of explicit signal rules (urgency, OTP/PIN requests, shortened links,
  app-install pushes, prize and job-offer bait, ...) feeds hints into the model's own judgment
  (`signals.py`).
- **13 languages**, a "simple mode" for easier reading, and read-aloud for people who struggle to read.
- **Country-specific reporting contacts** (e.g. India 1930 / cybercrime.gov.in).
- **Known-scam matching** so a message flagged before is recognised, plus a "Was this right?" feedback button.
- **Reliability fallback** between models if the primary one fails.

### Stack
FastAPI (Python), Groq API (`openai/gpt-oss-120b` primary, `openai/gpt-oss-20b` fallback,
`qwen/qwen3.8-27b` for images), Supabase for the scan log, plain HTML/CSS/JS front end, deployed on Vercel.

## Setup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
2. Copy `.env.example` to `.env` and fill in `GROQ_API_KEY`, `SUPABASE_URL` and `SUPABASE_KEY`
   (use the server-side `service_role` key; it never reaches the browser).

## Run it locally
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install fastapi groq requests python-dotenv python-multipart uvicorn
uvicorn app:app --reload
```
Then open http://127.0.0.1:8000 (Second Look) and http://127.0.0.1:8000/tellsign (Tellsign).

## Files
- `prototype.html`: Second Look prototype (served at `/`)
- `tellsign.html`: Tellsign front end (served at `/tellsign`)
- `app.py`: FastAPI app and Tellsign API
- `signals.py`: the rule-based scam signals
- `supabase/schema.sql`: the `scans` table the API reads and writes
- `analysis/`: Second Look trigger scoring on the synthetic HuskyHack data
- `deck/`: Second Look presentation slides
- `screenshots/`, `test-samples/`: Tellsign screenshots and example scam messages
