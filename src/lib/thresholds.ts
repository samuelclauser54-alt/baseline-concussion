// Decision thresholds, in one place so they're easy to audit and tune.
// Each comes with where it came from. The ones marked PROVISIONAL are this
// app's own starting points and should be re-tuned with test-retest data
// (see scripts/analyze_reliability.py and docs/SCIENCE.md).

export const THRESHOLDS = {
  /**
   * Symptoms: flag if ANY symptom is rated higher than at baseline (or any
   * symptom at all when there's no baseline). Symptoms are the single most
   * accurate sideline measure (AUC 0.93; a 2-point rise gave 86% sensitivity /
   * 80% specificity, Harmon et al., JAMA Netw Open 2024). We use a 1-point
   * rise on purpose: missing a concussion is far worse than a false alarm, and
   * the Concussion Recognition Tool says any symptom after a head impact means
   * the athlete should be removed from play.
   */
  symptomIncrease: 1,

  /**
   * Cognitive score (orientation + memory + concentration + delayed recall,
   * 0–50): flag a drop of 2 or more points from baseline.
   * Basis: on the 30-point SAC, any decline from baseline on the sideline was
   * 95% sensitive and 76% specific (McCrea, J Athl Train 2001). A newer study
   * found the SAC much weaker alone (AUC 0.70; Harmon et al., 2024), which is
   * why it is one of six domains here, not the main signal. Our scale has
   * ~1.7× as many points as the SAC, so 2 points ≈ 1 SAC point.
   */
  cognitiveDrop: 2,

  /**
   * Reaction time: flag if the median is ≥8% slower than baseline AND the
   * slowing is statistically real (one-sided Mann–Whitney p < 0.05 over the
   * individual trials). PROVISIONAL: requiring both a meaningful size and
   * statistical significance keeps ordinary day-to-day variation from
   * triggering it. Re-tune with test-retest data.
   */
  reactionSlowdownPct: 8,
  reactionP: 0.05,
  /** Flag 2+ more "tapped on red" errors than baseline (impulse control). */
  commissionIncrease: 2,

  /**
   * Balance: flag if overall sway (geometric mean across the three stances) is
   * ≥1.5× baseline, or there are 3+ more balance errors in total.
   * PROVISIONAL: phone-measured sway has only moderate test-retest
   * reliability (Sway app ICC 0.21–0.57), so the cutoff is set wide to avoid
   * false alarms. Re-tune with test-retest data.
   */
  swayRatio: 1.5,
  balanceErrorIncrease: 3,

  /**
   * Eyes & motion (VOMS-style): flag if any symptom rises ≥2 points (0–10)
   * above the pre-test rating during any item, the clinical cutoff from
   * Mucha et al. (2014). With a baseline, provocation must also exceed what
   * the athlete showed at baseline.
   */
  vestibularProvocation: 2,

  /** Baseline effort checks: results this weak suggest a rushed or sandbagged
   *  baseline, which would hide a later concussion. */
  baselineMaxMedianRT: 450,
  baselineMaxCommissions: 3,
  baselineMinImmediateMemory: 15,
} as const
