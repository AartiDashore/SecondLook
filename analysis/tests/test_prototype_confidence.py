from __future__ import annotations

import json
import re
import sys
import unittest
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[2]
ANALYSIS_DIR = PROJECT_DIR / "analysis"
PROTOTYPE_PATH = PROJECT_DIR / "prototype.html"
sys.path.insert(0, str(ANALYSIS_DIR))

from score_all_members import (  # noqa: E402
    CONFIDENCE_ANCHORS,
    assign_risk_tier,
    normalize_risk_score,
)


class PrototypeConfidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PROTOTYPE_PATH.read_text(encoding="utf-8")

    def test_frontend_and_backend_use_same_confidence_anchors(self):
        match = re.search(r"const MAX_INTERNAL_RISK=190,CONFIDENCE_ANCHORS=(\[.*?\]);", self.html)
        self.assertIsNotNone(match)
        frontend_anchors = json.loads(match.group(1))
        self.assertEqual(frontend_anchors, [list(anchor) for anchor in CONFIDENCE_ANCHORS])

    def test_visible_templates_do_not_render_raw_points_or_thresholds(self):
        forbidden_visible_markup = [
            "Score ${",
            "<h3>Score",
            "<th>Score",
            "(${x[2]",
            "${p>0?",
            "Score 20:",
            "tune points",
            "lowers risk by 25 points",
            "<b>${p",
        ]
        for text in forbidden_visible_markup:
            with self.subTest(text=text):
                self.assertNotIn(text, self.html)

    def test_confidence_visuals_include_required_colors_and_accessibility(self):
        for class_name in ["confidence-low", "confidence-moderate", "confidence-high"]:
            self.assertIn(class_name, self.html)
        self.assertIn("Confidence Score: ${value}%", self.html)
        self.assertIn('role="progressbar"', self.html)
        self.assertIn('role="img"', self.html)

    def test_all_demo_scenarios_have_valid_non_reassuring_confidence(self):
        signal_block = self.html.split("const SIG=[", 1)[1].split("];\nconst S=", 1)[0]
        weights = {
            signal_id: int(weight)
            for signal_id, weight in re.findall(r'\["(\w+)","[^"]+",(-?\d+)\]', signal_block)
        }
        scenarios = re.findall(
            r'(\w+):\{n:"[^"]+",id:"[^"]+",sub:"[^"]+",on:\[([^\]]*)\]',
            self.html,
        )
        self.assertEqual(len(scenarios), 6)
        for scenario_name, enabled_source in scenarios:
            enabled = re.findall(r'"(\w+)"', enabled_source)
            raw_risk = sum(weights[signal_id] for signal_id in enabled)
            confidence = round(normalize_risk_score(raw_risk)[1])
            tier = assign_risk_tier(raw_risk, "reset" in enabled and "contact" in enabled)
            with self.subTest(scenario=scenario_name):
                self.assertGreaterEqual(confidence, 0)
                self.assertLessEqual(confidence, 100)
                if tier in {"Pause", "Stop"}:
                    self.assertLess(confidence, 70)
                if tier == "Stop":
                    self.assertLess(confidence, 40)


if __name__ == "__main__":
    unittest.main()
