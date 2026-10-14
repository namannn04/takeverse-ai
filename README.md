# Takeverse

A local interactive drama engine with a cinematic story library, consequential narrative graph, character relationships, expressive Fish Audio Drama 3 speech, and a story creation studio.

## Run locally

Requires Node.js 22+ and npm. SQLite uses `better-sqlite3`; if a prebuilt binary is unavailable, install your operating system's C++ build tools.

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://127.0.0.1:5173. The API runs on http://127.0.0.1:3001. Both bind to loopback. For a production build:

```bash
npm run build
npm start
```

Open http://127.0.0.1:3001. No cloud services are required for authored stories, editing, choices, saves or replay.

## Enable real speech

Set `FISH_API_KEY` in `.env` and restart the server. Click the speaker button beside a dialogue line; the server calls the real hosted Fish endpoint with `model: drama-3`. The UI shows loading, playback or the actual error. It never substitutes browser speech or claims a successful generation without receiving audio.

Starter characters use public voice IDs listed in the [official Drama 3 guide](https://docs.fish.audio/features/text-to-speech/drama-3). Change voice IDs in Studio → Characters. New characters use `FISH_REFERENCE_ID` if set; otherwise Fish chooses a default voice. A configured key does not guarantee quota, voice access or provider availability. Generation incurs your Fish API charges. Identical takes are cached in `data/audio/`.

This implementation requests one character line at a time for individual playback and caching. Fish also supports multi-speaker generation; batch generation, streaming, editing and director revisions of existing audio are not exposed here.

## Enable the AI director

Set `LLM_API_KEY`, optionally `LLM_BASE_URL` (an OpenAI-compatible base URL including `/v1`) and `LLM_MODEL`. Restart the API. The custom-response field sends canonical scene context, character personalities, relationship state, discoveries and up to eight retrieved episodic memories to the configured service. It receives validated dialogue and performance directions. Generated performances and the player's response are persisted with the session. Speaker buttons can voice the generated lines too.

The director cannot change inventory, invent graph transitions or mutate trust. Choose an authored decision to advance the plot. Without a director, the interface explicitly displays authored narrative mode. Memory retrieval uses lexical relevance plus recency, not vector embeddings. Memory is isolated per playthrough. This is one bounded director call, not independently scheduled autonomous character agents.

## Playing and creating

- Discover: filter/search three original short stories. Each has three endings and relationship-dependent choices.
- Player: choose a response, observe trust and clues, listen to performances, or enter custom dialogue when configured. Each choice automatically creates a checkpoint.
- My stories: resume any local playthrough after restarting the application.
- Your path: fork an earlier checkpoint into a new session. Previous branches remain untouched.
- Creator Studio: create a story; add characters with personality and voice references; add scenes and performance directions; add choices with target nodes, trust effects, clue discoveries and prerequisite flags. Click graph connections to navigate their targets.
- Save validates the entire graph. Test story saves and starts an isolated playthrough. Existing sessions retain a snapshot of their story, even when you edit the source.
- Export/import story JSON from Studio. Imported JSON is validated before use.

The editor is a connected scene-card graph, with connection targets edited in the scene form; it does not offer free-position drag-and-drop nodes. Looping stories are allowed. Authors must ensure their prerequisite flags do not make a scene impossible to leave; structural validation checks IDs and targets, while tests exercise the supplied starter paths.

## Data and backups

SQLite stores story definitions, immutable session story snapshots, state, custom dialogue performances and checkpoints in `data/takeverse.db`. WAL mode and synchronous transactions protect transitions. Version checks reject duplicate or stale writes (including AI results that return after a scene changed). Close the server before copying the entire `data/` directory for a simple consistent backup. Keys and generated audio are excluded from Git. The application is a single-user local tool; do not expose it publicly without authentication and deployment hardening.

## Verify

```bash
npm test
npm run build
```

Tests cover consequences, trust guards, endings, malformed graphs, replay isolation, stale writes, persistence, dialogue memory and the exact provider request. See [architecture and research](docs/ARCHITECTURE.md) and [verification notes](docs/VERIFICATION.md).

Photos: illustrative Unsplash imagery, loaded from `images.unsplash.com`. Fonts: Google Fonts (DM Sans, DM Mono, Instrument Serif). Offline rendering falls back to local system fonts and background colors. No copyrighted game characters or assets are used.

## Scope

This release is a complete local authored vertical slice plus Creator Studio and optional live providers. It is not a production multi-user platform, a full autonomous character society, a vector-memory service, or an audio workstation. Live provider quality cannot be verified without valid credentials. The supplied build prompt contained a literal “867 lines hidden” marker; only its visible requirements were available.
