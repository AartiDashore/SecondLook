# Second Look (HuskyHack 2026)

The payment-risk prototype lives in `analysis/score_all_members.py`. It preserves the original raw-risk weights and Pass/Nudge/Pause/Stop thresholds while adding a deterministic whole-number 0–100 confidence score and structured risk-factor explanations.

Confidence uses the same tier-aligned interpolation in Python and `prototype.html`: effective risk 0 maps to 100% confidence, the Pause boundary maps to 69%, the account-takeover Stop boundary maps to 39%, and maximum risk maps to 0%. The percentage is a consistent decision aid, not a statistically calibrated probability.

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

Install the runtime dependencies:

```bash
python -m pip install -r requirements.txt
```

Run the API from the project root:

```bash
python -m uvicorn analysis.api:app --host 127.0.0.1 --port 8000
```

Request a payment confidence response:

```bash
curl http://127.0.0.1:8000/api/confidence/M1002/P1002-012
```

The response includes only the member ID, payment ID, whole-number confidence percentage, risk tier, and up to three triggered positive risk factors. Internal risk points, factor contributions, thresholds, and normalization details are intentionally omitted.

Python callers can use the same logic without running a web server:

```python
from analysis.score_all_members import get_transaction_confidence

response = get_transaction_confidence("M1002", "P1002-012")
```

Print a full internal audit for all of Michael's initiated payments followed by the clean public response for one selected payment:

```bash
python analysis/inspect_member_confidence.py M1002 P1002-012
```
