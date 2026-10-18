from __future__ import annotations

import unittest
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[2]


class ActiveFrontendIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (PROJECT_DIR / "index.html").read_text()
        cls.script = (PROJECT_DIR / "script.js").read_text()
        cls.server = (PROJECT_DIR / "server.js").read_text()

    def test_active_frontend_uses_node_demo_endpoint(self):
        self.assertIn("fetch('/api/demo/michael'", self.script)
        self.assertIn("top_risk_factors", self.script)
        self.assertIn("confidence_percentage", self.script)
        self.assertNotIn("const SCORE", self.script)
        self.assertNotIn("const RISKS", self.script)

    def test_existing_confidence_and_factor_elements_are_reused(self):
        for element_id in ["score", "progress", "badge", "riskHeading", "riskList"]:
            self.assertIn(f'id="{element_id}"', self.html)
            self.assertIn(f"getElementById('{element_id}')", self.script)

    def test_frontend_has_required_confidence_color_boundaries(self):
        self.assertIn("score <= 39", self.script)
        self.assertIn("score <= 69", self.script)
        self.assertIn("CONFIDENCE_COLORS.low", self.script)
        self.assertIn("CONFIDENCE_COLORS.moderate", self.script)
        self.assertIn("CONFIDENCE_COLORS.high", self.script)

    def test_active_ui_does_not_render_internal_scoring_values(self):
        visible_sources = self.html + self.script
        for internal_name in [
            "raw_risk_score",
            "normalized_risk_score",
            "MAX_POSSIBLE_RISK_SCORE",
            "contribution",
        ]:
            self.assertNotIn(internal_name, visible_sources)

    def test_node_server_serves_active_ui_not_prototype(self):
        self.assertIn("sendProjectFile('index.html')", self.server)
        self.assertNotIn("prototype.html", self.server)


if __name__ == "__main__":
    unittest.main()
