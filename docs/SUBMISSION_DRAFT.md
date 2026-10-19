# Congressional App Challenge: submission draft

> **Rewrite these in your own words before submitting.** They're a starting point. Judges can tell when answers aren't the student's voice, and you need to be able to explain every part. Fill in every `[brackets]` item.

**App name:** Baseline: Sideline Concussion Check
**District:** NE-02 (Rep. Don Bacon)
**Platform:** Web app / Progressive Web App (works on iPhone, Android, and laptops; installable; works offline)
**Languages & tools:** TypeScript, React, Tailwind CSS, Vite, Vitest; Python (data analysis); Web APIs: DeviceMotion (accelerometer), Web Audio, Speech Synthesis, Service Workers
**Live app:** [Vercel URL] · **Code:** [GitHub URL] · **Video:** [YouTube URL]

## What does your app do?
Baseline is a free phone app that helps coaches spot concussions on the sideline when no athletic trainer is around. Before the season, each athlete records a healthy "baseline" (symptoms, memory, reaction time, balance, and eye-movement tests). After a hard hit, the coach runs the same 8-minute check and Baseline compares the athlete to their own baseline. It then says "call 911", "remove from play", or "no changes detected". It never clears anyone to play. The phone's accelerometer measures balance objectively, reaction time is timed to the millisecond, and a statistical test separates real changes from normal variation.

## What inspired you?
[Your real reason. One or two specific sentences: a teammate who played through a concussion, a game you watched, your own sport.] I learned that 63% of U.S. public high schools don't have a full-time athletic trainer, and about half of high-school football concussions go unreported. That means coaches often make the call alone. The tests trainers use already exist and are backed by research. They just weren't in a form a coach could actually use on a sideline.

## What technical challenges did you face?
- **Measuring balance with a phone:** I had to separate gravity from body sway in raw accelerometer data. I used a low-pass filter to track gravity, subtracted it, and projected the motion onto the horizontal plane. I wrote unit tests to show the score doesn't depend on how the phone is tilted.
- **Accurate reaction timing:** React re-renders can add delay, so the timing code updates the screen directly and uses the animation-frame and touch-event timestamps from the same high-resolution clock.
- **Telling real changes from noise:** reaction times vary trial to trial, so I compare the individual trials to baseline with a Mann–Whitney U test instead of just comparing averages.
- **Being honest about accuracy:** I read the research on each test, put every threshold and its source in one file, and wrote a Python script to measure test-retest reliability and false-alarm rate.

## What would you add next?
A reliability study with classmates (two baselines a few days apart) to tune the thresholds. Then, with an athletic trainer, a pilot at Omaha schools that don't have full-time trainers.

## Anything else?
Privacy was a priority: no accounts and no server. All athlete data stays on the coach's phone, and research exports are anonymized.

Nebraska law requires coaches to notify a parent when an athlete is removed. Baseline writes that message in English or Spanish, because many families in our district speak Spanish at home. [If a Spanish teacher or native speaker reviewed it, say who here.]
