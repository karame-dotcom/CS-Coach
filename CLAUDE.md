# CLAUDE.md

## Daily routine

When I say "eod" or "good night":
1. Make sure the project builds (or for a skill, runs) successfully.
2. Write .claude/session-handoff.md with: what we finished, files changed,
   decisions made, anything unfinished or buggy, and the next step.
   Include the current branch name.
3. Commit everything and push this branch.
4. Tell me in 2-3 lines what we did and whether this branch is ready
   to merge into main.

When I say "good morning":
1. Read .claude/session-handoff.md. If it isn't on this branch, check
   the most recently pushed branches for it and tell me which branch
   has it and whether I should switch.
2. Summarize where we left off and the next step in 2-3 lines.
3. Wait for me to say go before making changes.

## Safety rules

1. Never lose or alter users' saved data (progress, history, scores,
   settings). Any change to the data format needs a migration that
   converts old data.
2. Never commit API keys or passwords to the repo.
3. If this builds an APK: never change the applicationId or signing
   key, and increase versionCode and versionName with every release.
4. Before changing how anything is scored, graded, or calculated, show
   me before/after results on sample data.
5. New work goes on a branch; merge to main only when the build passes.
6. Live sites must keep working. This project may be deployed on GitHub
   Pages and/or Render.
   - Don't change the GitHub Pages settings, base path, or deploy
     workflow, or Render's build command, start command, render.yaml, or
     environment variable names, without asking me first.
   - Never hardcode URLs or keys that the live site gets from environment
     variables.
   - Before saying a task is done, confirm the build that GitHub Pages or
     Render runs will succeed.
   - During "good night", tell me if anything we changed affects the live
     site, so I can check it after merging.
