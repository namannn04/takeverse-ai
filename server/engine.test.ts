import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initial, advance, available } from './engine';
import { seeds } from './stories';
import { createStore } from './store';
import { StorySchema } from '../shared/schema';
import { speechRequest, retrieve } from './providers';
const story = seeds[0];
test('choices change trust, retain clues and leave the prior state immutable', () => {
  const before = initial(story);
  const next = advance(story, before, 'honest');
  assert.equal(before.node, 'arrival');
  assert.equal(next.trust.mara, 68);
  const after = advance(story, next, 'listen');
  assert.deepEqual(after.clues, ['The lighthouse recording']);
  assert.equal(after.memories.length, 2);
  assert.ok(after.flags.includes('heard-recording'));
});
test('trust gates cannot be bypassed by calling the reducer', () => {
  const state = advance(story, initial(story), 'cold');
  const choice = story.scenes[1].choices.find((c) => c.id === 'ask')!;
  assert.equal(available(state, choice), false);
  assert.throws(() => advance(story, state, 'ask'), /not available/);
  assert.throws(() => advance(story, state, 'invented'), /not available/);
});
test('all three endings are reachable and no explored path deadlocks', () => {
  const endings = new Set<string>();
  function visit(state: ReturnType<typeof initial>, depth = 0) {
    assert.ok(depth < 10);
    const scene = story.scenes.find((n) => n.id === state.node)!;
    if (scene.ending) {
      endings.add(scene.ending);
      return;
    }
    const choices = scene.choices.filter((c) => available(state, c));
    assert.ok(choices.length);
    for (const c of choices) visit(advance(story, state, c.id), depth + 1);
  }
  visit(initial(story));
  assert.equal(endings.size, 3);
});
test('malformed creator graphs fail validation', () => {
  const bad = structuredClone(story);
  bad.scenes[0].choices[0].target = 'missing';
  assert.equal(StorySchema.safeParse(bad).success, false);
  bad.scenes[0].choices[0].target = 'evidence';
  bad.scenes[0].lines[0].character = 'unknown';
  assert.equal(StorySchema.safeParse(bad).success, false);
});
test('replay forks preserve original saves and active story snapshots', () => {
  const store = createStore(':memory:');
  try {
    const s = store.create(story);
    const first = store.checkpoints(s.id)[0];
    store.choose(s.id, 0, 'honest');
    const fork = store.fork(s.id, first.id);
    assert.notEqual(fork.id, s.id);
    assert.equal(fork.state.node, 'arrival');
    assert.equal(store.getSession(s.id).state.node, 'evidence');
    store.choose(fork.id, 0, 'cold');
    assert.equal(store.getSession(s.id).state.trust.mara, 68);
    const edited = structuredClone(story);
    edited.title = 'Changed in Studio';
    store.saveStory(edited);
    assert.equal(store.getSession(s.id).story.title, 'The Last Light');
    assert.throws(() => store.fork(fork.id, first.id), /not found/);
  } finally {
    store.db.close();
  }
});
test('stale and duplicate mutations are rejected atomically', () => {
  const store = createStore(':memory:');
  try {
    const s = store.create(story);
    store.choose(s.id, 0, 'honest');
    assert.throws(() => store.choose(s.id, 0, 'listen'), /changed/);
    assert.equal(store.getSession(s.id).state.memories.length, 1);
    assert.equal(store.checkpoints(s.id).length, 2);
  } finally {
    store.db.close();
  }
});
test('manual save and custom director responses are persisted with checkpoints', () => {
  const store = createStore(':memory:');
  try {
    const s = store.create(story);
    const lines = [
      {
        character: 'mara',
        text: 'I remember your promise.',
        direction: 'softly',
      },
    ];
    const changed = store.remember(s.id, 0, 'You can trust me.', lines);
    assert.deepEqual(changed.performance?.lines, lines);
    assert.equal(changed.state.memories[0].text, 'You can trust me.');
    const saved = store.save(s.id, 1);
    assert.equal(saved.version, 2);
    assert.equal(store.checkpoints(s.id).length, 3);
    assert.ok(retrieve(saved, 'trust').length);
  } finally {
    store.db.close();
  }
});
test('Fish request explicitly selects Drama 3 with per-character voice and directions', () => {
  const r = speechRequest('Stay with me.', 'whispering', 'voice-123');
  assert.equal(r.url, 'https://api.fish.audio/v1/tts');
  assert.equal(r.headers.model, 'drama-3');
  assert.deepEqual(r.body, {
    text: '[whispering] Stay with me.',
    format: 'mp3',
    reference_id: 'voice-123',
  });
});

test('each starter story validates and all of its endings are reachable', () => {
  for (const candidate of seeds) {
    assert.equal(StorySchema.safeParse(candidate).success, true);
    const endings = new Set<string>();
    const visit = (state: ReturnType<typeof initial>) => {
      const scene = candidate.scenes.find((n) => n.id === state.node)!;
      if (scene.ending) {
        endings.add(scene.ending);
        return;
      }
      for (const choice of scene.choices.filter((c) => available(state, c))) {
        visit(advance(candidate, state, choice.id));
      }
    };
    visit(initial(candidate));
    assert.equal(endings.size, 3);
  }
});
