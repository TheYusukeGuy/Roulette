# ROULETTE
Randomized productivity scheduler: you set the rules, ROULETTE decides what happens next. Pure HTML/CSS/JS, no build, no backend.

## Run locally
Service workers need http: `cd roulette && python3 -m http.server 8000`, then open http://localhost:8000.
Tests: `node tests/randomizer-tests.js && node tests/timer-tests.js`.

## Deploy to GitHub Pages
Push the folder contents to a repo, then Settings → Pages → deploy from branch (root). All paths are relative, so project subdirectories work.

## Install as PWA
Open the deployed URL in Chrome/Edge/Android and choose Install / Add to Home Screen. After the first load it works offline.

## Backup and restore
Settings → Export JSON / Import JSON. Imports are validated first; a failed import changes nothing and the previous data is copied to a `.bak` key. Data is per-browser; there is no sync.

## How the randomizer works (js/randomizer.js)
score = categoryWeight × categoryPriority/3 × taskPriority/3 × taskWeight × taskNeglect × categoryNeglect × deadline.
- Neglect: +30%/day since last pick (cap ×3) for tasks, +20%/day (cap ×2.5) for categories.
- Deadline: ramps up over the final 7 days to ×2.5 (also the overdue value), so overdue tasks never monopolize.
- The task just picked is down-weighted ×0.3 (still possible); chaos "allow repetition" removes this.
- Selection is weighted-random (roulette wheel), never "highest score wins". Disabled tasks/categories and tasks marked unavailable are never eligible, even in chaos.

## Rules
Break after every N work intervals (default 1). Leisure after N *completed* intervals overrides the break. Bonus (every M completions) adds bonus minutes; if both are due it is one combined leisure draw. Empty leisure pool: reward stays banked. Chaos counts every draw (task or chaos leisure) and ends after the last one.

## Known limitations
- Notifications/sounds only fire while the tab/app is alive; a timer that expires while closed shows "time is up" on next open.
- Predicted timeline assumes default durations and successful outcomes.
- No sound asset files; effects are synthesized with WebAudio. No automated UI/browser tests were run; verification covered the unit tests and syntax checks.
