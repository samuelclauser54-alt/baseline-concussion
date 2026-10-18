# The science behind Baseline

This document explains where each test comes from, how accurate it is likely to be, and what we don't know yet.

## 1. Why a personal baseline?

People vary a lot. One healthy athlete's normal reaction time can be another's impaired one. So Baseline compares each athlete to **their own** healthy pre-season results, not to population averages. The NCAA–DoD CARE Consortium (1,458 athletes, 1,640 concussions) found sideline assessment works best when a same-season pre-injury baseline is available (Broglio et al., *Sports Med*, 2019).

## 2. What each test measures, and the evidence

| Domain | Evidence | Rule in Baseline |
|---|---|---|
| **Symptoms** (22 items, 0–6) | Most accurate single sideline measure: AUC 0.93; a 2-point rise gave 86% sensitivity / 80% specificity (Harmon et al., *JAMA Netw Open*, 2024). Alone: 68% sensitivity (Broglio et al., *Neurosurgery*, 2007). | Flag if **any** symptom is higher than baseline (any symptom at all with no baseline). Deliberately more sensitive than the 2-point rule. |
| **Memory & thinking** (SAC-style: orientation, 3×10-word recall, digits backward, months backward, delayed recall) | Any SAC decline on the sideline: 95% sensitive, 76% specific (McCrea, *J Athl Train*, 2001). But a 2024 study found the 10-word SAC weaker alone (AUC 0.70; 45% of concussed athletes scored at/above baseline; Harmon 2024). | Flag a drop of ≥2 points on our 50-point scale (≈1 SAC point). |
| **Reaction time** (go/no-go, 18 go + 6 no-go) | Computerized neurocognitive tests: ~79% sensitivity (Broglio 2007). | Flag if median is ≥8% slower **and** a one-sided Mann–Whitney U test on individual trials gives p < 0.05, or 2+ more impulse errors. *Provisional.* |
| **Balance** (3 stances × 20 s, eyes closed, phone on chest) | Postural control: 62% sensitivity (Broglio 2007). The FDA-cleared Sway app (also phone accelerometer) reported 69.6% sensitivity in its 510(k) summary; its test-retest ICC was 0.21–0.57 in healthy adults (Burghart et al., 2017). | Flag if sway is ≥1.5× baseline (geometric mean over stances) or 3+ more balance errors. *Provisional.* |
| **Eyes & motion** (VOMS-style: pursuit, saccades, VOR, visual motion sensitivity) | AUC 0.89 combined with near-point convergence (Mucha et al., *Am J Sports Med*, 2014); ≥2-point symptom provocation is the clinical cutoff. | Flag a ≥2-point rise that exceeds the athlete's baseline provocation. Near-point convergence is **not** included (it needs a ruler). |
| **Danger / observable signs** | Concussion Recognition Tool 6 (Echemendia et al., *Br J Sports Med*, 2023). | Any red flag → 911. Any observable sign → remove from play. |

## 3. Why combine tests?

Different concussions show up on different tests. Combining them raises sensitivity a lot:

- Symptoms + postural control + neurocognitive testing: **>90% sensitivity** (Broglio et al., 2007).
- Three-test battery: **80% sensitivity / 100% specificity** with discriminant analysis, **100% sensitivity** with clinical interpretation guidelines; any single test misclassified up to 47.5% (Resch et al., *BMJ Open Sport Exerc Med*, 2016).

Baseline uses an **"any domain flags"** rule. This maximizes sensitivity, because a concussion only has to show up on one test. The cost is more false alarms.

## 4. Our accuracy estimate (and its limits)

**Estimated sensitivity: roughly 85–95%** for a same-day check when a valid baseline exists. Reasoning:
- Symptoms alone already reach 68–86% in published studies, and our symptom rule is stricter (any increase).
- An "any-flag" combination of symptoms, cognition, balance, reaction time, and VOMS behaves like the published multi-test batteries (>90%).
- We go a little lower than the published batteries because our phone versions of the balance and reaction tests haven't been validated against lab equipment.

**Specificity is unknown and is probably the weakest part.** Every extra domain adds a chance of a false alarm on a healthy athlete. On the sideline that's an acceptable trade (a false alarm means sitting out and seeing a doctor), but it should be measured.

**What this estimate is NOT:** a clinical validation. Baseline has not been tested on concussed athletes. That would require a partnership with athletic trainers or a sports-medicine clinic and ethics approval.

## 5. What we can measure now: the reliability study

False alarms come from day-to-day noise in healthy people. That we can measure without anyone getting hurt:

1. 15–20 healthy volunteers each record a baseline, then a second baseline 2–7 days later (same phone, similar time of day).
2. Export the anonymized CSV (Data → Export anonymized CSV).
3. Run `python3 scripts/analyze_reliability.py baseline-sessions-*.csv`.

The script reports:
- **ICC(2,1)** for each measure: how repeatable it is (>0.75 = good).
- **SEM / MDC95**: the smallest change that's bigger than noise. These become better-justified thresholds.
- **False-positive rate**: the fraction of healthy retests the app's own decision rules would have flagged. 1 − this rate is an empirical **specificity estimate**, with a 95% confidence interval.

The thresholds marked *provisional* in `src/lib/thresholds.ts` should be re-tuned with these results.

## 6. Known limitations

- **Not a diagnosis.** It never clears an athlete. Nebraska law requires written clearance from a licensed health-care provider.
- **Baselines can be sandbagged.** Athletes sometimes underperform on purpose so a later concussion looks "normal." Baseline warns about suspicious baselines (slow reaction time, many impulse errors, low recall), but can't fully prevent it.
- **Phone differences.** Sensor rates and touchscreen latency vary between phones. Use the same phone for baseline and checks when possible.
- **Symptoms are self-reported.** Athletes who want to keep playing may under-report. That's why observable signs and objective tests are included.
- **Symptoms can appear hours later.** A "no changes" result is not the end. Re-check symptoms later and after the game.
- **Ages 9–40.** VOMS norms come from this age range.

## References

- Broglio SP, Macciocchi SN, Ferrara MS. Sensitivity of the concussion assessment battery. *Neurosurgery*. 2007;60(6):1050-7.
- Broglio SP, et al. Acute sport concussion assessment optimization: a prospective assessment from the CARE Consortium. *Sports Med*. 2019.
- Burghart M, et al. Reliability and validity of a mobile device application for use in sports-related concussion balance assessment. *Curr Res Concussion*. 2017.
- Echemendia RJ, et al. Concussion Recognition Tool 6. *Br J Sports Med*. 2023.
- Harmon KG, et al. Diagnosis of sports-related concussion using symptom report or Standardized Assessment of Concussion. *JAMA Netw Open*. 2024;7(6):e2416223.
- McCrea M. Standardized mental status testing on the sideline after sport-related concussion. *J Athl Train*. 2001.
- McCrea M, et al. Unreported concussion in high school football players. *Clin J Sport Med*. 2004;14(1):13-7.
- Mucha A, et al. A brief Vestibular/Ocular Motor Screening (VOMS) assessment to evaluate concussions. *Am J Sports Med*. 2014;42(10):2479-86.
- Patricios JS, et al. Consensus statement on concussion in sport: the 6th International Conference (Amsterdam 2022). *Br J Sports Med*. 2023.
- Pryor RR, et al. Athletic training services in public secondary schools: a benchmark study. *J Athl Train*. 2015;50(2):156-62.
- Resch JE, et al. The sensitivity and specificity of clinical measures of sport concussion: three tests are better than one. *BMJ Open Sport Exerc Med*. 2016;2:e000012.
- Nebraska Concussion Awareness Act, LB 260 (2011), amended 2014 (return to learn).
