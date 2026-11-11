# Session handoff — 2026-11-11

**Branch:** `claude/wonderful-brown-9uogvi` (this is the repo's default branch; there is no `main` on GitHub yet)
**App version:** 1.27.2 (service worker cache `cs-coach-v31`)

## Finished today
- Report a problem: attach up to 3 pictures (share sheet on phones; email fallback).
- GCash donations: Settings → Support CS Coach (number, QR, account name), plus an occasional note in the chat.
- Tabs reordered: Practice, Analytics, Kiko (chat), Calendar, Settings. The top-right gear was removed. Practice is the home tab.
- Lessons hidden: a greyed-out "Coming soon" card in Settings → Quiz & schedule. The `LESSONS_ON` switch in app.js turns them back on.
- Practice tab order: subjects → Mistakes & Starred → Full Mock Exam → AI-generated questions (full width).
- CLAUDE.md added with the Daily routine and Safety rules.

## Files changed (today)
- www/app.js, www/styles.css, www/index.html, www/i18n.js, www/coach.js, www/config.js, www/sw.js
- www/icons/gcash-qr.png
- CLAUDE.md, .claude/session-handoff.md

## Decisions
- Lessons stay in the code but are hidden behind `LESSONS_ON=false` until the content is finished.
- The Pages workflow deploys on pushes to `main` **and** this branch, so pushes here go live right away.
- Picture reports use the Web Share API, because mailto links can't carry attachments.

## Checks done at EOD
- `node --check` passes on all www/*.js and server/*.js files.
- Browser smoke test (all 5 tabs) shows no page errors and version 1.27.2.
- The last Pages deploy (run 27, commit e01e95e) succeeded. This handoff commit changes no www/ files, so it doesn't trigger a deploy.

## Unfinished / known issues
- Lessons content is still in progress (hidden).
- There is no `main` branch on GitHub. Decide whether to create one from this branch or keep this branch as the default.
- The Maya number in config.js is empty, so only GCash shows.

## Next step
- Finish the lessons, then set `LESSONS_ON=true` in www/app.js. Or tell me the next feature.
