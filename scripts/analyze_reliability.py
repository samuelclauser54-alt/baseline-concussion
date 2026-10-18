#!/usr/bin/env python3
"""
Test-retest reliability study for Baseline.

How to run the study
--------------------
1. Recruit healthy volunteers (classmates, teammates); 15-20 is a good start.
2. Each person records a baseline in Baseline, then a SECOND baseline
   2-7 days later, at a similar time of day, on the same phone.
3. In the app: Data -> "Export anonymized CSV".
4. python3 scripts/analyze_reliability.py baseline-sessions-YYYY-MM-DD.csv

What it reports
---------------
* ICC(2,1): how consistent each measure is between the two sessions
  (0 = pure noise, 1 = perfectly repeatable; >0.75 is "good").
* SEM and MDC95: the smallest change that is bigger than measurement noise.
* False-positive rate: every volunteer is healthy, so if the app's decision
  rules flag a retest, that is a false alarm. 1 - this rate estimates
  specificity.

Only the Python standard library is needed.
"""

from __future__ import annotations

import csv
import math
import statistics as st
import sys
from collections import defaultdict

METRICS = [
    ("symptom_severity", "Symptom severity", "pts"),
    ("cognitive_total", "Memory & thinking", "pts"),
    ("rt_median_ms", "Reaction time (median)", "ms"),
    ("sway_together_mg", "Sway: feet together", "mg"),
    ("sway_tandem_mg", "Sway: heel-to-toe", "mg"),
    ("sway_single_mg", "Sway: one leg", "mg"),
    ("sway_composite_mg", "Sway: composite", "mg"),
    ("balance_errors", "Balance errors", "err"),
]


def icc_2_1(pairs: list[tuple[float, float]]) -> float:
    """Two-way random effects, absolute agreement, single measurement (Shrout & Fleiss)."""
    n, k = len(pairs), 2
    if n < 3:
        return float("nan")
    grand = sum(a + b for a, b in pairs) / (n * k)
    row_means = [(a + b) / 2 for a, b in pairs]
    col_means = [sum(p[j] for p in pairs) / n for j in range(k)]
    ss_rows = k * sum((m - grand) ** 2 for m in row_means)
    ss_cols = n * sum((m - grand) ** 2 for m in col_means)
    ss_total = sum((x - grand) ** 2 for p in pairs for x in p)
    ss_err = ss_total - ss_rows - ss_cols
    msr = ss_rows / (n - 1)
    msc = ss_cols / (k - 1)
    mse = ss_err / ((n - 1) * (k - 1))
    denom = msr + (k - 1) * mse + k * (msc - mse) / n
    return (msr - mse) / denom if denom else float("nan")


def label(icc: float) -> str:
    if math.isnan(icc):
        return "n/a"
    return "excellent" if icc >= 0.9 else "good" if icc >= 0.75 else "moderate" if icc >= 0.5 else "poor"


def main(path: str) -> None:
    rows = list(csv.DictReader(open(path, newline="")))
    by_athlete: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        if r["kind"] == "baseline":
            by_athlete[r["athlete"]].append(r)
    pairs_rows = [(v[0], v[1]) for v in by_athlete.values() if len(v) >= 2]
    print(f"\n{len(pairs_rows)} athletes with two baselines ({len(rows)} sessions in file)\n")
    if len(pairs_rows) < 3:
        print("Need at least 3 athletes with two baselines each.")
        return

    print(f"{'Measure':26} {'n':>3} {'ICC(2,1)':>9}  {'':9} {'SEM':>11} {'MDC95':>11}  mean change")
    print("-" * 92)
    for key, name, unit in METRICS:
        pairs = []
        for a, b in pairs_rows:
            try:
                pairs.append((float(a[key]), float(b[key])))
            except (ValueError, KeyError):
                pass
        if len(pairs) < 3:
            continue
        icc = icc_2_1(pairs)
        all_vals = [x for p in pairs for x in p]
        sd = st.stdev(all_vals)
        sem = sd * math.sqrt(max(0.0, 1 - icc)) if not math.isnan(icc) else float("nan")
        mdc = 1.96 * math.sqrt(2) * sem
        diff = st.mean(b - a for a, b in pairs)
        print(f"{name:26} {len(pairs):>3} {icc:>9.2f}  {label(icc):9} {sem:>6.1f} {unit:<4} {mdc:>6.1f} {unit:<4}  {diff:+.1f} {unit}")

    # Relative thresholds the app uses (ratio for sway, % for reaction time)
    sway_ratios = []
    rt_pct = []
    for a, b in pairs_rows:
        try:
            sway_ratios.append(float(b["sway_composite_mg"]) / float(a["sway_composite_mg"]))
        except (ValueError, ZeroDivisionError):
            pass
        try:
            rt_pct.append(100 * (float(b["rt_median_ms"]) - float(a["rt_median_ms"])) / float(a["rt_median_ms"]))
        except (ValueError, ZeroDivisionError):
            pass
    print()
    if len(sway_ratios) >= 3:
        logs = [math.log(r) for r in sway_ratios]
        hi = math.exp(st.mean(logs) + 1.645 * st.stdev(logs))
        print(f"Sway retest ratio: median {st.median(sway_ratios):.2f}x; 95th-percentile healthy ratio ~ {hi:.2f}x (app flags at 1.50x)")
    if len(rt_pct) >= 3:
        hi = st.mean(rt_pct) + 1.645 * st.stdev(rt_pct)
        print(f"Reaction-time retest change: mean {st.mean(rt_pct):+.1f}%; 95th percentile ~ {hi:+.1f}% (app flags at +8% and p<0.05)")

    # False positives
    retests = [r for r in rows if r["kind"] == "baseline" and r.get("retest_flags")]
    if retests:
        flagged = [r for r in retests if r["retest_flags"] != "none"]
        fp = len(flagged) / len(retests)
        print(f"\nFalse-positive rate on healthy retests: {len(flagged)}/{len(retests)} = {fp:.0%}"
              f"  -> estimated specificity {1 - fp:.0%}")
        counts: dict[str, int] = defaultdict(int)
        for r in flagged:
            for d in r["retest_flags"].split("|"):
                counts[d] += 1
        for d, c in sorted(counts.items(), key=lambda x: -x[1]):
            print(f"  {d:12} flagged in {c} retest(s)")
        # Wilson 95% interval, honest for small samples
        n = len(retests)
        z = 1.96
        p = 1 - fp
        centre = (p + z * z / (2 * n)) / (1 + z * z / n)
        half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
        print(f"  specificity 95% CI: {max(0, centre - half):.0%} to {min(1, centre + half):.0%} (n = {n})")
    print()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1])
