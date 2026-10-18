"""Print auditable member scoring details and one clean mobile response."""

from __future__ import annotations

import argparse
import json

from score_all_members import (
    MICHAEL_MEMBER_ID,
    get_transaction_confidence,
    get_scam_payment_ids,
    load_and_score,
    rank_positive_risk_factors,
    select_demo_payment_id,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("member_id", nargs="?", default=MICHAEL_MEMBER_ID)
    parser.add_argument("payment_id", nargs="?", help="Optional selected scam payment ID")
    args = parser.parse_args()

    selected_payment_id = args.payment_id or select_demo_payment_id(args.member_id)
    scam_payment_ids = set(get_scam_payment_ids(args.member_id))

    scored = load_and_score()
    member_payments = scored[scored["member_id"].eq(args.member_id)].sort_values(
        ["event_timestamp", "payment_id"]
    )
    if member_payments.empty:
        parser.error(f"No initiated payments found for member {args.member_id!r}")

    print(f"Detailed scoring audit for {args.member_id}")
    for payment in member_payments.itertuples():
        triggered = [
            f"{factor['id']} ({factor['contribution']:+d})"
            for factor in payment.risk_factors
        ]
        top_factors = [
            factor["id"]
            for factor in rank_positive_risk_factors(payment.risk_factors)
        ]
        print(
            f"{payment.payment_id} | {payment.event_timestamp} | "
            f"${payment.amount:,.2f} {payment.payment_rail} | "
            f"scam_labeled={'yes' if payment.payment_id in scam_payment_ids else 'no'} | "
            f"recipient={payment.recipient_id} age_days={payment.recipient_age_days} "
            f"baseline_ratio={payment.amount_to_baseline_ratio} | "
            f"raw={payment.raw_risk_score} | confidence={payment.confidence_percentage}% | "
            f"tier={payment.risk_tier}"
        )
        print(f"  triggered: {', '.join(triggered) if triggered else 'none'}")
        print(f"  top 3: {', '.join(top_factors) if top_factors else 'none'}")

    print(f"\nSelected demo payment: {selected_payment_id}")
    print("Public JSON response")
    print(
        json.dumps(
            get_transaction_confidence(args.member_id, selected_payment_id),
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
