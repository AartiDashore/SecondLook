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
