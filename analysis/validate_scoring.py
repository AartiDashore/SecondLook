"""Compare the legacy scorer with the refactored SecondLook scorer."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

from score_all_members import (
    DEFAULT_EVENTS_PATH,
    MAX_POSSIBLE_RISK_SCORE,
    load_and_score,
    normalize_risk_score,
)


BASE_DIR = Path(__file__).resolve().parent
MEMBER_KEY_PATH = BASE_DIR / "HuskyHack_Member_Key_v2.csv"
FLAGGED_TIERS = {"Pause", "Stop"}


def legacy_score_events(events: pd.DataFrame) -> pd.DataFrame:
    """Reproduce the original implementation in memory for comparison only."""
    rows = []
    for member_id, group in events.groupby("synthetic_member_id"):
        group = group.sort_values("event_sequence")
        for _, payment in group[group.event_type == "Payment Initiated"].iterrows():
            timestamp = payment.event_timestamp
            window = group[
                (group.event_timestamp <= timestamp)
                & (group.event_timestamp >= timestamp - pd.Timedelta(hours=72))
            ]
            event_types = set(window.event_type)
            score = 0

            def add(condition: Any, points: int) -> None:
                nonlocal score
                if condition:
                    score += points

            add(payment.recipient_status == "New" and (pd.isna(payment.recipient_age_days) or payment.recipient_age_days < 30), 20)
            ratio = payment.amount_to_baseline_ratio
            add(ratio >= 3, 20)
            add(1.5 <= ratio < 3, 10)
            days_since_rail = payment.days_since_last_same_rail
            add(pd.isna(days_since_rail) and payment.payment_rail in ("Wire", "ACH") or days_since_rail >= 365, 15)
            add("Password Reset" in event_types, 20)
            add(bool({"Email Change", "Phone Change"} & event_types), 30)
            add("Address Change" in event_types and not ({"Email Change", "Phone Change"} & event_types), 5)
            add(payment.payment_rail == "Cash" and payment.amount >= 5000, 25)
            add(bool({"Branch Visit", "Contact Center Call"} & event_types) and payment.payment_rail in ("Cash", "Wire"), 10)
            recent_prior = group[
                (group.event_timestamp < timestamp)
                & (group.event_timestamp >= timestamp - pd.Timedelta(days=30))
                & (group.event_type == "Payment Initiated")
                & (group.recipient_id == payment.recipient_id)
                & group.recipient_id.notna()
            ]
            baseline = payment.amount / ratio if ratio and ratio > 0 else 1e9
            cumulative = recent_prior.amount.sum() + payment.amount
            add(
                cumulative >= 3 * baseline and payment.recipient_status == "New"
                or cumulative >= 3 * baseline and len(recent_prior) >= 1 and payment.recipient_age_days < 30,
                20,
            )
            prior = group[
                (group.event_timestamp < timestamp)
                & (group.event_type == "Payment Initiated")
                & (group.recipient_id == payment.recipient_id)
                & group.recipient_id.notna()
            ]
            add(len(prior) >= 2 and prior.amount.is_monotonic_increasing and payment.amount > prior.amount.iloc[-1], 15)
            add(
                (
                    (group.event_type == "Warning Displayed")
                    & (group.event_timestamp < timestamp)
                    & (group.recipient_id == payment.recipient_id)
                ).any(),
                15,
            )
            add(payment.recipient_status == "Existing" and payment.recipient_age_days >= 30, -20)
            account_takeover = "Password Reset" in event_types and bool({"Email Change", "Phone Change"} & event_types)
            tier = "Stop" if account_takeover and score >= 60 else "Pause" if score >= 45 else "Nudge" if score >= 25 else "Pass"
            rows.append({"payment_id": payment.payment_id, "raw_risk_score": score, "risk_tier": tier})
    return pd.DataFrame(rows)


def build_validation_summary() -> dict[str, Any]:
    events = pd.read_csv(DEFAULT_EVENTS_PATH, parse_dates=["event_timestamp"])
    member_key = pd.read_csv(MEMBER_KEY_PATH)
    legacy = legacy_score_events(events)
    updated = load_and_score(DEFAULT_EVENTS_PATH)

    comparison = legacy.merge(
        updated[["payment_id", "raw_risk_score", "risk_tier"]],
        on="payment_id",
        suffixes=("_before", "_after"),
        validate="one_to_one",
    )
    scam_ids = {
        payment_id
        for value in member_key["scam_payment_ids"].dropna()
        for payment_id in str(value).split(";")
        if payment_id
    }
    legitimate_member_ids = set(
        member_key.loc[member_key["is_legitimate_lookalike"].eq("Yes"), "synthetic_member_id"]
    )
    flagged = updated["risk_tier"].isin(FLAGGED_TIERS)
    known_scam = updated["payment_id"].isin(scam_ids)
    non_scam = ~known_scam
    legitimate_lookalike = updated["member_id"].isin(legitimate_member_ids)
    confidence_by_risk = [
        round(normalize_risk_score(raw_risk)[1])
        for raw_risk in range(MAX_POSSIBLE_RISK_SCORE + 1)
    ]

    return {
        "payment_count": len(updated),
        "before": {
            "raw_risk_min": int(legacy.raw_risk_score.min()),
            "raw_risk_max": int(legacy.raw_risk_score.max()),
            "negative_raw_scores": int(legacy.raw_risk_score.lt(0).sum()),
            "tiers": legacy.risk_tier.value_counts().sort_index().to_dict(),
        },
        "after": {
            "raw_risk_min": int(updated.raw_risk_score.min()),
            "raw_risk_max": int(updated.raw_risk_score.max()),
            "normalized_confidence_min": float(updated.confidence_score.min()),
            "normalized_confidence_max": float(updated.confidence_score.max()),
            "negative_raw_scores": int(updated.raw_risk_score.lt(0).sum()),
            "confidence_scores_outside_0_100": int((~updated.confidence_score.between(0, 100)).sum()),
            "non_integer_confidence_scores": int(
                updated.confidence_score.ne(updated.confidence_score.round()).sum()
            ),
            "pause_or_stop_green_confidences": int(
                (updated.risk_tier.isin({"Pause", "Stop"}) & updated.confidence_score.ge(70)).sum()
            ),
            "stop_non_red_confidences": int(
                (updated.risk_tier.eq("Stop") & updated.confidence_score.ge(40)).sum()
            ),
            "confidence_monotonicity_violations": sum(
                following > current
                for current, following in zip(confidence_by_risk, confidence_by_risk[1:])
            ),
            "tiers": updated.risk_tier.value_counts().sort_index().to_dict(),
        },
        "known_scam_transactions": {
            "total": int(known_scam.sum()),
            "flagged_pause_or_stop": int((known_scam & flagged).sum()),
        },
        "non_scam_transactions": {
            "total": int(non_scam.sum()),
            "flagged_pause_or_stop": int((non_scam & flagged).sum()),
        },
        "legitimate_lookalike_transactions": {
            "total": int(legitimate_lookalike.sum()),
            "flagged_pause_or_stop": int((legitimate_lookalike & flagged).sum()),
        },
        "raw_score_changes": int(comparison.raw_risk_score_before.ne(comparison.raw_risk_score_after).sum()),
        "tier_assignment_changes": int(comparison.risk_tier_before.ne(comparison.risk_tier_after).sum()),
    }


if __name__ == "__main__":
    print(json.dumps(build_validation_summary(), indent=2, sort_keys=True))
