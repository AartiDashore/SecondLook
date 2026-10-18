# Second Look (HuskyHack 2026)

- prototype.html: clickable demo. Double-click to open in any browser. No install.
- analysis/score_all_members.py: scores every payment in the synthetic events file with the same points as the prototype. Run from the folder holding the HuskyHack CSV files:  pip install pandas numpy && python score_all_members.py
  It prints tier counts by group. Results are illustrations on synthetic data, not accuracy or fraud rates.
- deck/: Slides source (deck.json plus slides/*.html, 1920x1080 inline-styled). View it in the published deck link, or paste into a Slides artifact.

Note: the "Evidence" numbers for look-alikes after Planned Moment come from a short follow-up calculation (subtract 25 points for home-closing, vehicle-cash and contractor look-alikes) that is not in this script.
