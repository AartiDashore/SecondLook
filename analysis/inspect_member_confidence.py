"""Print auditable member scoring details and one clean mobile response."""

from __future__ import annotations

import argparse
import json

from score_all_members import (
    get_transaction_confidence,
    load_and_score,
    rank_positive_risk_factors,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("member_id", help="Synthetic member ID, for example M1002")
    parser.add_argument("payment_id", help="Selected payment ID for the public response")
    args = parser.parse_args()

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
            f"raw={payment.raw_risk_score} | confidence={payment.confidence_percentage}% | "
            f"tier={payment.risk_tier}"
        )
        print(f"  triggered: {', '.join(triggered) if triggered else 'none'}")
        print(f"  top 3: {', '.join(top_factors) if top_factors else 'none'}")

    print("\nPublic JSON response")
    print(
        json.dumps(
            get_transaction_confidence(args.member_id, args.payment_id),
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
