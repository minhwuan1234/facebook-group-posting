# Facebook Post Bot — Progress Tracking

Last updated: 27 July 2026

## Project objective

Build a command-triggered Facebook Group posting bot.

The bot uses a deterministic browser automation flow and does not use AI to
identify interface elements or decide what actions to perform.

During Phase 1, the bot will:

1. Receive a command from the user.
2. Open a Facebook Group from a stored URL.
3. Open the Facebook post composer.
4. Insert prepared content.
5. Upload prepared images.
6. Stop before clicking the Post button.
7. Wait for the user to review and publish manually.

---

## Overall progress

Current overall progress: 27%

| Phase | Status | Progress |
|---|---|---:|
| Phase 1 — Semi-automatic posting | In progress | 27% |
| Phase 2 — Multiple groups and job queue | Not started | 0% |
| Phase 3 — Dashboard and Railway backend | Not started | 0% |
| Phase 4 — Controlled auto-publishing | Not started | 0% |

---

# Phase 1 — Semi-automatic posting

## Phase objective

Prepare one Facebook Group post from a predefined group URL, content and image
set, then stop before publishing.

## Step 1 — Isolated Chrome environment

### Objective

Create a dedicated Chrome profile and CDP port for the Facebook bot so it does
not conflict with existing local automation flows.

### Completion criteria

- [x] Dedicated Chrome profile created.
- [x] Chrome uses remote debugging port 9223.
- [x] CDP endpoint responds successfully.
- [x] Existing flow remains unaffected.

Step progress: 100%

---

## Step 2 — Repository and project foundation

### Objective

Create a standalone Node.js and Playwright project with a clear folder
structure, configuration, scripts and progress tracking.

### Completion criteria

- [ ] GitHub repository created.
- [ ] Repository cloned to the Mac.
- [ ] Node.js project initialised.
- [ ] Playwright installed.
- [ ] Folder structure created.
- [ ] `.gitignore` added.
- [ ] `.env.example` added.
- [ ] Initial README added.
- [ ] Initial commit pushed to GitHub.

Step progress: 0%

---

## Step 3 — Command-line interface

### Objective

Allow the user to start a predefined posting flow using a deterministic command.

### Expected command

```bash
npm run post -- --group group-01 --post post-001
