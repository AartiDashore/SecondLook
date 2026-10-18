# Second Look (HuskyHack 2026)

The payment-risk engine lives in `analysis/score_all_members.py`. It preserves the original raw-risk weights and Pass/Nudge/Pause/Stop thresholds while adding a deterministic whole-number 0–100 confidence score and structured risk-factor explanations.

Confidence uses tier-aligned interpolation in Python: effective risk 0 maps to 100% confidence, the Pause boundary maps to 69%, the account-takeover Stop boundary maps to 39%, and maximum risk maps to 0%. The percentage is a consistent decision aid, not a statistically calibrated probability.

Run the scorer from any directory:

```bash
python analysis/score_all_members.py
```

Run the automated tests and before/after validation:

```bash
python -m unittest discover -s analysis/tests -v
python analysis/validate_scoring.py
```

The member-key labels are used only by the validation script. They are not scoring inputs and are not written to `analysis/scored_payments.pkl`.

## Mobile confidence API

The active frontend is `index.html`. The browser calls the Node.js server, Node proxies JSON from FastAPI, and FastAPI invokes the Python scoring engine. `prototype.html` is retained only as a legacy reference and is not served by the application.

Install the Python and Node.js dependencies from the project root:

```bash
python -m pip install -r requirements.txt
npm install
```

Run both servers with one command:

```bash
npm run dev
```

Set `PYTHON=/path/to/python` if `python3` is not the interpreter where the Python requirements were installed.

Alternatively, run the services in separate terminals:

```bash
# Terminal 1: Python scoring API
python -m uvicorn analysis.api:app --host 127.0.0.1 --port 8000

# Terminal 2: Node frontend and API proxy
npm start
```

Open the application at:

```text
http://127.0.0.1:3000
```

Test the public endpoints:

```bash
curl http://127.0.0.1:8000/api/demo/michael
curl http://127.0.0.1:3000/api/demo/michael
```

The demo endpoint selects the latest scam-labeled M1002 wire payment from the actual event and member-key files. To select a different scam-labeled M1002 payment without changing code, set `SECONDLOOK_DEMO_PAYMENT_ID`. The development launcher uses `PYTHON_API_PORT` (default `8000`), while the Node server uses `PYTHON_API_URL` (default `http://127.0.0.1:8000`) and `PORT` (default `3000`).

The public response includes only the member ID, payment ID, whole-number confidence percentage, risk tier, and up to three triggered positive risk factors. Internal risk points, factor contributions, thresholds, normalization details, and scam labels are intentionally omitted.

Python callers can use the same logic without running a web server:

```python
from analysis.score_all_members import get_transaction_confidence

response = get_transaction_confidence("M1002", "P1002-012")
```

Print a full internal audit for all of Michael's initiated payments, including offline scam labels and internal factor points, followed by the clean public response:

```bash
python analysis/inspect_member_confidence.py
```

Run all tests and the full synthetic-data validation:

```bash
python -m unittest discover -s analysis/tests -v
npm test
python analysis/validate_scoring.py
```

## Romance scam comic

This six-frame storyboard follows a member reviewing a $500 P2P payment to someone impersonating Ryan Gosling. She uses Second Look to review a WhatsApp screenshot, considers the transaction risk factors, chooses “Let me think about it,” and cancels the payment before questioning the request on WhatsApp.

![Six-frame comic showing a woman using Second Look to review a suspicious payment, cancel it without sending money, and question a celebrity impersonator on WhatsApp.](docs/images/second-look-romance-scam-comic.png)

The comic uses the supplied Sound Credit Union interface design. Any score shown in the storyboard is illustrative artwork and is not used by the live M1002 demo, which always loads its confidence percentage from the Python scoring API. The scoring scales are described in [DESIGN.md](DESIGN.md).
