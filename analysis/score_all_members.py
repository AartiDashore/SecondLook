"""Score SecondLook payments and produce frontend-ready confidence data."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_EVENTS_PATH = BASE_DIR / "HuskyHack_Synthetic_Events_v2.csv"
DEFAULT_OUTPUT_PATH = BASE_DIR / "scored_payments.pkl"

RISK_RULES = {
    "new_recipient": {
        "weight": 20,
        "title": "New recipient",
        "explanation": "This recipient was added less than 30 days ago.",
        "legacy_id": "new",
    },
    "unusually_large_amount": {
        "weight": 20,
        "title": "Significantly higher amount",
        "explanation": "This payment is at least three times the member's usual baseline.",
        "legacy_id": "amt3",
        "exclusive_group": "amount_ratio",
    },
    "above_typical_amount": {
        "weight": 10,
        "title": "Higher than usual amount",
        "explanation": "This payment is between 1.5 and three times the member's usual baseline.",
        "legacy_id": "amt15",
        "exclusive_group": "amount_ratio",
    },
    "infrequent_payment_rail": {
        "weight": 15,
        "title": "Unfamiliar payment method",
        "explanation": "This payment method is new or has not been used for at least a year.",
        "legacy_id": "firstRail",
    },
    "recent_password_reset": {
        "weight": 20,
        "title": "Recent password reset",
        "explanation": "A password reset occurred within the previous 72 hours.",
        "legacy_id": "reset",
    },
    "recent_contact_change": {
        "weight": 30,
        "title": "Recent contact change",
        "explanation": "An email address or phone number changed within the previous 72 hours.",
        "legacy_id": "contact",
        "exclusive_group": "profile_change",
    },
    "recent_address_change": {
        "weight": 5,
        "title": "Recent address change",
        "explanation": "An address change occurred within the previous 72 hours.",
        "legacy_id": "addr",
        "exclusive_group": "profile_change",
    },
    "large_cash_transaction": {
        "weight": 25,
        "title": "Large cash transaction",
        "explanation": "This cash transaction is $5,000 or more.",
        "legacy_id": "bigCash",
    },
    "assisted_transaction": {
        "weight": 10,
        "title": "Assisted high-risk payment",
        "explanation": "A branch or contact-center interaction occurred before this cash or wire payment.",
        "legacy_id": "assisted",
    },
    "cumulative_recipient_total": {
        "weight": 20,
        "title": "Higher than your usual total",
        "explanation": "The 30-day total sent to this recipient is at least three times the usual baseline.",
        "legacy_id": "cum",
    },
    "increasing_payments": {
        "weight": 15,
        "title": "Increasing payments",
        "explanation": "Earlier payments to this recipient increased in amount, and this payment is higher again.",
        "legacy_id": "rising",
    },
    "previous_warning": {
        "weight": 15,
        "title": "Previous warning",
        "explanation": "A warning was previously displayed for this recipient.",
        "legacy_id": "ignored",
    },
    "established_recipient": {
        "weight": -20,
        "title": "Established recipient",
        "explanation": "This recipient has been established for at least 30 days, which reduces risk.",
        "legacy_id": "known",
    },
}

RECOMMENDATIONS = {
    "Stop": "Do not proceed",
    "Pause": "Review recommended",
    "Nudge": "Proceed with caution",
    "Pass": "No additional review recommended",
}


def calculate_max_possible_risk_score(rules: dict[str, dict[str, Any]] = RISK_RULES) -> int:
    """Return the theoretical positive maximum, respecting exclusive rule groups."""
    ungrouped_total = 0
    grouped_maxima: dict[str, int] = {}
    for rule in rules.values():
        weight = int(rule["weight"])
        if weight <= 0:
            continue
        group = rule.get("exclusive_group")
        if group:
            grouped_maxima[group] = max(grouped_maxima.get(group, 0), weight)
        else:
            ungrouped_total += weight
    return ungrouped_total + sum(grouped_maxima.values())


MAX_POSSIBLE_RISK_SCORE = calculate_max_possible_risk_score()
PAUSE_RISK_THRESHOLD = 45
STOP_RISK_THRESHOLD = 60
CONFIDENCE_ANCHORS = (
    (0.0, 100.0),
    (float(PAUSE_RISK_THRESHOLD), 69.0),
    (float(STOP_RISK_THRESHOLD), 39.0),
    (float(MAX_POSSIBLE_RISK_SCORE), 0.0),
)


def normalize_risk_score(raw_risk_score: Any, max_possible_risk_score: Any = MAX_POSSIBLE_RISK_SCORE) -> tuple[float, float]:
    """Return risk and confidence percentages using tier-aligned interpolation."""
    raw_score = _finite_number(raw_risk_score, default=0.0)
    maximum = _finite_number(max_possible_risk_score, default=0.0)
    if maximum <= 0:
        return 0.0, 100.0
    effective_risk = min(max(raw_score, 0.0), maximum)
    if maximum <= STOP_RISK_THRESHOLD:
        confidence = 100.0 - (effective_risk / maximum) * 100.0
    else:
        anchors = (
            (0.0, 100.0),
            (float(PAUSE_RISK_THRESHOLD), 69.0),
            (float(STOP_RISK_THRESHOLD), 39.0),
            (maximum, 0.0),
        )
        confidence = _interpolate_confidence(effective_risk, anchors)
    normalized_risk = 100.0 - confidence
    return normalized_risk, min(max(confidence, 0.0), 100.0)


def assign_risk_tier(raw_risk_score: Any, account_takeover_signal: bool = False) -> str:
    """Apply the original raw-risk thresholds without using normalized confidence."""
    score = _finite_number(raw_risk_score, default=0.0)
    if account_takeover_signal and score >= STOP_RISK_THRESHOLD:
        return "Stop"
    if score >= PAUSE_RISK_THRESHOLD:
        return "Pause"
    if score >= 25:
        return "Nudge"
    return "Pass"


def make_api_response(scored_payment: dict[str, Any] | pd.Series) -> dict[str, Any]:
    """Return the stable frontend payload for one scored payment."""
    value = scored_payment.to_dict() if isinstance(scored_payment, pd.Series) else scored_payment
    return {
        "payment_id": value.get("payment_id", value.get("pid")),
        "confidence_score": int(value["confidence_score"]),
        "confidence_percentage": int(value["confidence_percentage"]),
        "risk_tier": value.get("risk_tier", value.get("tier")),
        "recommendation": value["recommendation"],
        "risk_factors": value["risk_factors"],
    }


def score_events(events: pd.DataFrame) -> pd.DataFrame:
    """Score every Payment Initiated event without using outcome-label columns."""
    required = {
        "synthetic_member_id",
        "event_sequence",
        "event_timestamp",
        "event_type",
        "payment_id",
        "payment_rail",
        "amount",
        "recipient_id",
        "recipient_status",
        "recipient_age_days",
        "days_since_last_same_rail",
        "amount_to_baseline_ratio",
    }
    missing = sorted(required - set(events.columns))
    if missing:
        raise ValueError(f"Missing required event columns: {', '.join(missing)}")

    prepared = events.copy()
    prepared["event_timestamp"] = pd.to_datetime(prepared["event_timestamp"], errors="coerce")
    prepared["_source_order"] = np.arange(len(prepared))
    rows: list[dict[str, Any]] = []

    for member_id, member_events in prepared.groupby("synthetic_member_id", sort=False, dropna=False):
        member_events = member_events.sort_values(
            ["event_sequence", "event_timestamp", "_source_order"],
            kind="stable",
            na_position="last",
        ).copy()
        member_events["_event_order"] = np.arange(len(member_events))
        payments = member_events[member_events["event_type"].eq("Payment Initiated")]
        for _, payment in payments.iterrows():
            rows.append(_score_payment(member_id, member_events, payment))

    return pd.DataFrame(rows)


def load_and_score(events_path: Path | str = DEFAULT_EVENTS_PATH) -> pd.DataFrame:
    """Load the event CSV and score all initiated payments."""
    events = pd.read_csv(events_path, parse_dates=["event_timestamp"])
    return score_events(events)


def _score_payment(member_id: Any, member_events: pd.DataFrame, payment: pd.Series) -> dict[str, Any]:
    timestamp = payment["event_timestamp"]
    event_order = payment["_event_order"]
    history = member_events[member_events["_event_order"] < event_order]
    if pd.isna(timestamp):
        recent_events = history.iloc[0:0]
    else:
        recent_events = history[
            history["event_timestamp"].between(timestamp - pd.Timedelta(hours=72), timestamp, inclusive="both")
        ]
    recent_types = set(recent_events["event_type"].dropna())

    factors: list[dict[str, Any]] = []

    def add_factor(condition: Any, rule_id: str) -> None:
        if not _safe_condition(condition):
            return
        rule = RISK_RULES[rule_id]
        factors.append(
            {
                "id": rule_id,
                "title": rule["title"],
                "explanation": rule["explanation"],
                "contribution": rule["weight"],
            }
        )

    recipient_status = payment["recipient_status"]
    recipient_age = _optional_number(payment["recipient_age_days"])
    is_new_recipient = recipient_status == "New" and (recipient_age is None or recipient_age < 30)
    add_factor(is_new_recipient, "new_recipient")

    amount_ratio = _optional_number(payment["amount_to_baseline_ratio"])
    add_factor(amount_ratio is not None and amount_ratio >= 3, "unusually_large_amount")
    add_factor(amount_ratio is not None and 1.5 <= amount_ratio < 3, "above_typical_amount")

    days_since_rail = _optional_number(payment["days_since_last_same_rail"])
    payment_rail = payment["payment_rail"]
    add_factor(
        (days_since_rail is None and payment_rail in {"Wire", "ACH"})
        or (days_since_rail is not None and days_since_rail >= 365),
        "infrequent_payment_rail",
    )

    has_password_reset = "Password Reset" in recent_types
    has_contact_change = bool({"Email Change", "Phone Change"} & recent_types)
    add_factor(has_password_reset, "recent_password_reset")
    add_factor(has_contact_change, "recent_contact_change")
    add_factor("Address Change" in recent_types and not has_contact_change, "recent_address_change")

    amount = _finite_number(payment["amount"], default=0.0)
    add_factor(payment_rail == "Cash" and amount >= 5000, "large_cash_transaction")
    add_factor(
        bool({"Branch Visit", "Contact Center Call"} & recent_types) and payment_rail in {"Cash", "Wire"},
        "assisted_transaction",
    )

    recipient_id = payment["recipient_id"]
    has_recipient = not pd.isna(recipient_id)
    prior_payments = history[
        history["event_type"].eq("Payment Initiated")
        & history["recipient_id"].eq(recipient_id)
        & history["recipient_id"].notna()
    ]
    if not pd.isna(timestamp):
        recent_prior_payments = prior_payments[
            prior_payments["event_timestamp"].between(timestamp - pd.Timedelta(days=30), timestamp, inclusive="both")
        ]
    else:
        recent_prior_payments = prior_payments.iloc[0:0]

    baseline = amount / amount_ratio if amount_ratio is not None and amount_ratio > 0 else None
    cumulative_amount = pd.to_numeric(recent_prior_payments["amount"], errors="coerce").fillna(0).sum() + amount
    cumulative_is_high = baseline is not None and cumulative_amount >= 3 * baseline
    add_factor(
        has_recipient
        and cumulative_is_high
        and (recipient_status == "New" or (len(recent_prior_payments) >= 1 and recipient_age is not None and recipient_age < 30)),
        "cumulative_recipient_total",
    )

    prior_amounts = pd.to_numeric(prior_payments["amount"], errors="coerce")
    valid_prior_amounts = prior_amounts.dropna()
    add_factor(
        has_recipient
        and len(prior_amounts) >= 2
        and len(valid_prior_amounts) == len(prior_amounts)
        and valid_prior_amounts.is_monotonic_increasing
        and amount > valid_prior_amounts.iloc[-1],
        "increasing_payments",
    )

    add_factor(
        has_recipient
        and (
            history["event_type"].eq("Warning Displayed")
            & history["recipient_id"].eq(recipient_id)
        ).any(),
        "previous_warning",
    )
    add_factor(
        recipient_status == "Existing" and recipient_age is not None and recipient_age >= 30,
        "established_recipient",
    )

    raw_score = int(sum(factor["contribution"] for factor in factors))
    normalized_risk, confidence = normalize_risk_score(raw_score)
    confidence_percentage = int(round(confidence))
    account_takeover_signal = has_password_reset and has_contact_change
    tier = assign_risk_tier(raw_score, account_takeover_signal)
    legacy_signals = ",".join(RISK_RULES[factor["id"]]["legacy_id"] for factor in factors)

    return {
        "m": member_id,
        "pid": payment["payment_id"],
        "rail": payment_rail,
        "amt": amount,
        "s": raw_score,
        "tier": tier,
        "sig": legacy_signals,
        "t": timestamp,
        "member_id": member_id,
        "payment_id": payment["payment_id"],
        "payment_rail": payment_rail,
        "amount": amount,
        "raw_risk_score": raw_score,
        "normalized_risk_score": normalized_risk,
        "confidence_score": confidence_percentage,
        "confidence_percentage": confidence_percentage,
        "risk_tier": tier,
        "recommendation": RECOMMENDATIONS[tier],
        "risk_factors": factors,
        "event_timestamp": timestamp,
        "account_takeover_signal": account_takeover_signal,
    }


def _safe_condition(value: Any) -> bool:
    if value is None or value is pd.NA:
        return False
    try:
        if pd.isna(value):
            return False
    except (TypeError, ValueError):
        return False
    return bool(value)


def _optional_number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if np.isfinite(number) else None


def _finite_number(value: Any, default: float) -> float:
    number = _optional_number(value)
    return default if number is None else number


def _interpolate_confidence(
    effective_risk: float,
    anchors: tuple[tuple[float, float], ...],
) -> float:
    for (lower_risk, lower_confidence), (upper_risk, upper_confidence) in zip(anchors, anchors[1:]):
        if effective_risk <= upper_risk:
            span = upper_risk - lower_risk
            position = 0.0 if span == 0 else (effective_risk - lower_risk) / span
            return lower_confidence + position * (upper_confidence - lower_confidence)
    return anchors[-1][1]


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--events", type=Path, default=DEFAULT_EVENTS_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    scored = load_and_score(args.events)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    scored.to_pickle(args.output)
    print(f"Scored {len(scored)} payments to {args.output}")
    print(f"Maximum possible raw risk: {MAX_POSSIBLE_RISK_SCORE}")
    print(f"Raw risk range: {scored.raw_risk_score.min()} to {scored.raw_risk_score.max()}")
    print(f"Confidence range: {scored.confidence_score.min()} to {scored.confidence_score.max()}")
    print(f"Tiers: {scored.risk_tier.value_counts().sort_index().to_dict()}")


if __name__ == "__main__":
    main()
