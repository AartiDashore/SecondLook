from __future__ import annotations

import sys
import unittest
from pathlib import Path

import numpy as np
import pandas as pd


ANALYSIS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ANALYSIS_DIR))

from score_all_members import (  # noqa: E402
    MAX_POSSIBLE_RISK_SCORE,
    assign_risk_tier,
    calculate_max_possible_risk_score,
    make_api_response,
    normalize_risk_score,
    score_events,
)


def payment_event(**overrides):
    row = {
        "synthetic_member_id": "M1",
        "event_sequence": 1,
        "event_timestamp": "2026-10-01 10:00:00",
        "event_type": "Payment Initiated",
        "payment_id": "P1",
        "payment_rail": "P2P",
        "amount": 100.0,
        "recipient_id": "R1",
        "recipient_status": "Existing",
        "recipient_age_days": 60.0,
        "days_since_last_same_rail": 10.0,
        "amount_to_baseline_ratio": 1.0,
    }
    row.update(overrides)
    return row


class NormalizationTests(unittest.TestCase):
    def test_maximum_is_derived_from_rules(self):
        self.assertEqual(calculate_max_possible_risk_score(), 190)
        self.assertEqual(MAX_POSSIBLE_RISK_SCORE, 190)

    def test_no_effective_risk_has_full_confidence(self):
        self.assertEqual(normalize_risk_score(0), (0.0, 100.0))

    def test_one_risk_factor(self):
        normalized, confidence = normalize_risk_score(20)
        expected_confidence = 100 - (20 / 45) * 31
        self.assertAlmostEqual(normalized, 100 - expected_confidence)
        self.assertAlmostEqual(confidence, expected_confidence)

    def test_multiple_risk_factors(self):
        normalized, confidence = normalize_risk_score(65)
        self.assertAlmostEqual(normalized + confidence, 100.0)

    def test_tier_boundaries_do_not_look_reassuringly_green(self):
        self.assertEqual(round(normalize_risk_score(45)[1]), 69)
        self.assertEqual(round(normalize_risk_score(60)[1]), 39)

    def test_increasing_risk_never_increases_confidence(self):
        confidences = [normalize_risk_score(score)[1] for score in range(191)]
        self.assertTrue(all(current >= following for current, following in zip(confidences, confidences[1:])))

    def test_maximum_possible_risk_has_zero_confidence(self):
        self.assertEqual(normalize_risk_score(MAX_POSSIBLE_RISK_SCORE), (100.0, 0.0))

    def test_negative_and_missing_scores_are_safe(self):
        self.assertEqual(normalize_risk_score(-20), (0.0, 100.0))
        self.assertEqual(normalize_risk_score(np.nan), (0.0, 100.0))
        self.assertEqual(normalize_risk_score(None), (0.0, 100.0))

    def test_scores_above_expected_range_are_clamped(self):
        self.assertEqual(normalize_risk_score(999), (100.0, 0.0))

    def test_invalid_maximum_avoids_division_by_zero(self):
        self.assertEqual(normalize_risk_score(20, 0), (0.0, 100.0))
        self.assertEqual(normalize_risk_score(20, np.nan), (0.0, 100.0))


class ScoringTests(unittest.TestCase):
    def test_known_recipient_negative_adjustment(self):
        scored = score_events(pd.DataFrame([payment_event()])).iloc[0]
        self.assertEqual(scored.raw_risk_score, -20)
        self.assertEqual(scored.confidence_score, 100)
        self.assertEqual(scored.risk_tier, "Pass")
        self.assertEqual(scored.risk_factors[0]["id"], "established_recipient")
        self.assertEqual(scored.risk_factors[0]["contribution"], -20)

    def test_missing_values_do_not_create_unsupported_factors(self):
        scored = score_events(
            pd.DataFrame(
                [
                    payment_event(
                        recipient_status=np.nan,
                        recipient_age_days=np.nan,
                        days_since_last_same_rail=np.nan,
                        amount_to_baseline_ratio=np.nan,
                        amount=np.nan,
                    )
                ]
            )
        ).iloc[0]
        self.assertEqual(scored.raw_risk_score, 0)
        self.assertEqual(scored.risk_factors, [])
        self.assertEqual(scored.confidence_score, 100)

    def test_multiple_simultaneous_factors_and_api_response(self):
        events = pd.DataFrame(
            [
                payment_event(event_sequence=1, event_timestamp="2026-10-01 08:00", event_type="Password Reset", payment_id=np.nan),
                payment_event(event_sequence=2, event_timestamp="2026-10-01 09:00", event_type="Email Change", payment_id=np.nan),
                payment_event(
                    event_sequence=3,
                    event_timestamp="2026-10-01 10:00",
                    payment_id="P3",
                    payment_rail="Wire",
                    amount=10000,
                    recipient_status="New",
                    recipient_age_days=2,
                    days_since_last_same_rail=np.nan,
                    amount_to_baseline_ratio=4,
                ),
            ]
        )
        scored = score_events(events).iloc[0]
        factor_ids = {factor["id"] for factor in scored.risk_factors}
        self.assertTrue({"new_recipient", "unusually_large_amount", "infrequent_payment_rail", "recent_password_reset", "recent_contact_change"} <= factor_ids)
        self.assertEqual(scored.risk_tier, "Stop")
        response = make_api_response(scored)
        self.assertEqual(response["payment_id"], "P3")
        self.assertIsInstance(response["confidence_score"], int)
        self.assertIsInstance(response["confidence_percentage"], int)
        self.assertIsInstance(response["risk_factors"], list)
        self.assertNotIn("raw_risk_score", response)
        self.assertNotIn("normalized_risk_score", response)

    def test_scoring_is_consistent_across_dataset_sizes(self):
        target = payment_event()
        unrelated = payment_event(
            synthetic_member_id="M2",
            payment_id="P2",
            recipient_id="R2",
            recipient_status="New",
            recipient_age_days=1,
        )
        alone = score_events(pd.DataFrame([target])).iloc[0]
        combined = score_events(pd.DataFrame([target, unrelated]))
        combined_target = combined.loc[combined.payment_id.eq("P1")].iloc[0]
        self.assertEqual(alone.raw_risk_score, combined_target.raw_risk_score)
        self.assertEqual(alone.confidence_score, combined_target.confidence_score)

    def test_later_same_timestamp_event_is_not_used(self):
        events = pd.DataFrame(
            [
                payment_event(event_sequence=1, recipient_status="New", recipient_age_days=1),
                payment_event(event_sequence=2, event_type="Password Reset", payment_id=np.nan),
            ]
        )
        scored = score_events(events).iloc[0]
        self.assertNotIn("recent_password_reset", {factor["id"] for factor in scored.risk_factors})

    def test_original_tier_decisions_are_preserved(self):
        cases = [
            (24, False, "Pass"),
            (25, False, "Nudge"),
            (44, False, "Nudge"),
            (45, False, "Pause"),
            (60, False, "Pause"),
            (59, True, "Pause"),
            (60, True, "Stop"),
        ]
        for score, account_takeover, expected in cases:
            with self.subTest(score=score, account_takeover=account_takeover):
                self.assertEqual(assign_risk_tier(score, account_takeover), expected)


if __name__ == "__main__":
    unittest.main()
