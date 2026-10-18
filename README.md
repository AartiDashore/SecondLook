# Second Look (HuskyHack 2026)

This repo deploys as one Vercel project with two pages:

| Route | What it is |
|---|---|
| `/` | **Second Look** prototype (`prototype.html`): a pause the member controls |
| `/secondscan` | **SecondScan** scam scanner (`secondscan.html`), backed by the FastAPI API in `app.py` |
| `/api/*` | SecondScan API (`/api/scan`, `/api/scan-image`, `/api/feedback`, `/api/stats`, `/api/log`, `/api/languages`, `/api/ui-strings`) |

`analysis/` (offline scoring script and synthetic data) and `deck/` (presentation slides) are not deployed.

## SecondScan: AI scam detection & protection

Paste a suspicious message (or upload a screenshot of it) and SecondScan tells you, in plain language,
whether it looks like a scam, shows the exact phrases that gave it away, says what to do next, and
lists the cyber-crime reporting contacts for your country.

Adapted from https://github.com/propcgamer20-png/tellsign

### Features
- **Text and screenshot scanning.** Screenshots are read with Claude's vision.
- **Plain-language verdict** (likely scam / suspicious / looks safe) with the red-flag phrases quoted.
- **Rule engine + LLM.** A set of explicit signal rules (urgency, OTP/PIN requests, shortened links,
  app-install pushes, prize and job-offer bait, ...) feeds hints into the model's own judgment
  (`signals.py`).
- **13 languages**, a "simple mode" for easier reading, and read-aloud for people who struggle to read.
- **Country-specific reporting contacts** (e.g. India 1930 / cybercrime.gov.in).
- **Known-scam matching** so a message flagged before is recognised, plus a "Was this right?" feedback button.
- **Reliability fallback** between models if the primary one fails.

### Stack
FastAPI (Python), Claude API (`claude-opus-5-5` primary, `claude-sonnet-5-5` fallback, both read screenshots),
Supabase for the scan log, plain HTML/CSS/JS front end, deployed on Vercel.

## Setup

1. Copy `.env.example` to `.env` and fill in `ANTHROPIC_API_KEY` (from console.anthropic.com). `.env` is
   git-ignored, so keys stay on your machine; on Vercel, set the same names under Environment Variables.
2. Optional, for scan history, stats, feedback and known-scam matching: create a Supabase project, run
   `supabase/schema.sql` in its SQL Editor, and set `SUPABASE_URL` and `SUPABASE_KEY` (the server-side
   `service_role` key; it never reaches the browser). Without them, scanning still works.

## Run it locally
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install fastapi anthropic requests python-dotenv python-multipart uvicorn
uvicorn app:app --reload
```
Then open http://127.0.0.1:8000 (Second Look) and http://127.0.0.1:8000/secondscan (SecondScan).

`--reload` restarts the server whenever you save `app.py`. Edits to `secondscan.html` or the files in `static/` only need a browser refresh (Cmd+Shift+R if the old CSS/JS is cached).

## Files
- `prototype.html`: Second Look prototype (served at `/`)
- `secondscan.html`: SecondScan page markup (served at `/secondscan`)
- `static/secondscan.css`, `static/secondscan.js`: SecondScan styles and script (served at `/static/`)
- `app.py`: FastAPI app and SecondScan API
- `signals.py`: the rule-based scam signals
- `supabase/schema.sql`: the `scans` table the API reads and writes
- `analysis/`: Second Look trigger scoring on the synthetic HuskyHack data
- `deck/`: Second Look presentation slides
- `screenshots/`, `test-samples/`: SecondScan screenshots and example scam messages
