# Verification — 14 October 2026

## Automated

`npm test`: 17 passing tests. Includes real local HTTP requests against an ephemeral Express server and a temporary SQLite database, graph consequences and guards, all three endings for all three starters, invalid graph rejection, save/reopen durability, snapshot isolation, replay forks, duplicate/stale writes, provider response parsing, per-character voice routing, origin/host rejection and late AI response races.

Provider success/failure contract tests use explicitly named mocks. These verify integration behavior, not the quality of real generated performances.

`npm run build`: TypeScript and Vite production bundle pass. Vite reports harmless upstream Zod comment-annotation warnings.

## Browser walkthrough

Verified in the in-app browser against the running local application:

1. Opened the story library and entered The Last Light.
2. Selected the trusting response: Mara's trust changed from 50 to 68, and her next line referred to that earlier decision.
3. Played the recording: discovered the lighthouse recording and unlocked the joint resolution.
4. Reached “The truth, together.”
5. Reloaded, resumed the completed playthrough, opened its checkpoint history, and forked the earlier signal-room decision.
6. Selected the anonymous release and reached “A beautiful disappearance.” The first completed playthrough remained saved.
7. In Creator Studio, created The midnight visitor, named its character Ada, assigned a public Fish voice reference, authored a second scene, linked an opening choice, and configured a clue.
8. Used Test story, followed the authored connection, found the unburned letter and reached the custom ending “An unexpected reunion.”
9. Requested speech without a key and confirmed the explicit configuration error; no speech success was claimed.
10. Checked the player at a 390px mobile viewport; document width did not exceed viewport width. Restored the normal viewport.
11. Verified library genre filtering.

## Not verified live

No Fish or LLM credentials were supplied; the user will configure these later. Real voice generation, latency, billing, voice access, model output quality and expressive performance remain unverified. The app does not claim these checks passed. No screen recording capability was available in this local session; screenshots and the browser walkthrough above document the local checks.

Production smoke check: `npm start` on a separate local port served the built HTML and `/api/status` successfully. The temporary production process was stopped after verification; the development preview remains available.

## Follow-up verification

Repeated the full test suite and production build. Production dependency audit reported zero known vulnerabilities. Both GitHub CI checks for the initial PR head passed.

A new regression test exposed a replay defect: checkpoints saved narrative state but omitted the current generated character performance. Fixed checkpoints and forks to preserve that performance while keeping the original branch isolated. Legacy checkpoints without a performance remain compatible. The regression test now passes.

Fresh browser checks verified Neon Testament's distinct characters and scene, a cold response reducing Iris's trust to 32, the corresponding conditional dialogue, the disabled trust-dependent choice, successful manual save, and Escape dismissal of settings. Evidence: screenshots/verified_trust_gate.jpg.

Scope assessment: the authored player and Studio are functional. The broader master-prompt vision is not fully implemented: autonomous character-agent scheduling, dynamically generated scene graphs and vector-based memory retrieval are absent. The editor uses connected scene cards and form-based targets rather than a draggable graph canvas. Unsaved Studio changes do not survive a page reload. Live AI and speech still require credential-based verification.
