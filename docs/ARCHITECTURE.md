# Takeverse architecture and research

Research checked 14 October 2026. The supplied attachment has a literal “867 lines hidden” placeholder; those requirements are unavailable.

## Sources and decisions

- Fish Drama 3: https://docs.fish.audio/features/text-to-speech/drama-3 — hosted TTS at https://api.fish.audio/v1/tts, Authorization bearer, model: drama-3. Natural-language directions in square brackets and paired scope tags. Per-character requests keep voice routing explicit. Editing is not implemented; no unsupported editing API is claimed.
- Endpoint: https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech — JSON text, reference_id, mp3. Audio is returned only after a successful provider response. Content-addressed cache avoids billing for identical takes.
- LangGraph: https://docs.langchain.com/oss/javascript/langgraph/persistence and /memory — checkpoint/thread separation and short/long-term memory. A small deterministic reducer is a better fit here than introducing a full framework: an LLM cannot alter canonical graph edges or inventory.
- Ink: https://www.inklestudios.com/ink/web-tutorial/ — conditional choices, knots and diverts inspire explicit nodes, guards and effects.
- Twine: https://twinery.org/ — connected passages inform the Creator graph.
- Ren’Py: https://www.renpy.org/doc/html/save_load_rollback.html — immutable checkpoints and replay forks preserve previous saves.
- https://www.quanticdream.com/en/detroit-become-human/flowcharts — visible consequence paths; Life is Strange and Disco Elysium inform deliberative choices, character interiority and relationship feedback. No game assets or characters are copied.
- https://impeccable.style and https://www.awwwards.com — restrained hierarchy, editorial serif titles, cinematic scale and contextual controls. Awwwards fetch was unavailable.

## Model and boundaries

Story: id, title, genre, synopsis, art, characters, start, scenes. Character: id, name, role, personality, optional Fish voice ID. Scene: id, title, location, prose, character dialogue, choices, optional ending. Choice: target plus typed trust/clue/flag effects and optional guards.
Session: UUID, immutable story snapshot, current node, trust map, flags, clues, episodic memories, version. Each mutation compares a client version in a database transaction. Saves are snapshots; replay creates a new session from a prior checkpoint. Studio edits do not mutate active playthroughs.
SQLite WAL stores stories, sessions and checkpoints. Server-only environment keys. Local loopback binding; not an authenticated multi-user service. Optional director retrieves a bounded set of relevant memories, receives cast/personality/canonical scene and returns schema-validated performance dialogue. It cannot execute tools or choose transitions. Failure leaves authored dialogue intact and is reported.

## Design system

Ink/forest surfaces, warm ivory type, acid-lime action accent, restrained terracotta warnings. Serif display titles, sans UI and monospaced production labels. Library, player and Studio share one navigation shell. Reduced motion and keyboard focus supported. Remote Unsplash photography is illustrative and requires network; gradients remain readable offline.
