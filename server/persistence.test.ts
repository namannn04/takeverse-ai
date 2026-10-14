import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from './store';
import { seeds } from './stories';
import { performanceLines } from './engine';
test('saved sessions survive a database close and reopen', () => {
  const dir = mkdtempSync(join(tmpdir(), 'takeverse-'));
  const path = join(dir, 'test.db');
  try {
    let store = createStore(path);
    const session = store.create(seeds[0]);
    store.choose(session.id, 0, 'honest');
    store.save(session.id, 1);
    store.db.close();
    store = createStore(path);
    const restored = store.getSession(session.id);
    assert.equal(restored.state.node, 'evidence');
    assert.equal(restored.version, 2);
    assert.equal(restored.state.trust.mara, 68);
    assert.equal(store.checkpoints(session.id).length, 3);
    assert.ok(
      performanceLines(restored).some((l) => l.text.includes('deserve')),
    );
    assert.ok(
      !performanceLines(restored).some((l) => l.text.includes('Professional')),
    );
    store.db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
