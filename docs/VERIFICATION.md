# Verification — 14 October 2026

## Automated

`npm test`: 16 passing tests. Includes real local HTTP requests against an ephemeral Express server and a temporary SQLite database, graph consequences and guards, all three endings for all three starters, invalid graph rejection, save/reopen durability, snapshot isolation, replay forks, duplicate/stale writes, provider response parsing, per-character voice routing, origin/host rejection and late AI response races.

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
