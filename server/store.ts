import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { Story, Session, State, Checkpoint, Line } from '../shared/schema';
import { initial, advance } from './engine';
import { seeds } from './stories';
export function createStore(path = 'data/takeverse.db') {
  if (path !== ':memory:') mkdirSync('data', { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.exec(
    'CREATE TABLE IF NOT EXISTS stories(id TEXT PRIMARY KEY,body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS checkpoints(id INTEGER PRIMARY KEY AUTOINCREMENT,sessionId TEXT NOT NULL,body TEXT NOT NULL);',
  );
  for (const story of seeds)
    db.prepare('INSERT OR IGNORE INTO stories VALUES (?,?)').run(
      story.id,
      JSON.stringify(story),
    );
  const getStory = (id: string) => {
    const row = db.prepare('SELECT body FROM stories WHERE id=?').get(id) as
      { body: string } | undefined;
    if (!row) throw new Error('Story not found');
    return JSON.parse(row.body) as Story;
  };
  const getSession = (id: string) => {
    const row = db.prepare('SELECT body FROM sessions WHERE id=?').get(id) as
      { body: string } | undefined;
    if (!row) throw new Error('Session not found');
    return JSON.parse(row.body) as Session;
  };
  const write = (s: Session) => {
    db.prepare('INSERT OR REPLACE INTO sessions VALUES (?,?)').run(
      s.id,
      JSON.stringify(s),
    );
    return s;
  };
  const checkpoint = (s: Session, label: string) => {
    db.prepare('INSERT INTO checkpoints(sessionId,body) VALUES (?,?)').run(
      s.id,
      JSON.stringify({
        sessionId: s.id,
        state: s.state,
        performance: s.performance,
        version: s.version,
        label,
      }),
    );
  };
  const create = (
    story: Story,
    state: State = initial(story),
    performance?: Session['performance'],
  ) =>
    db.transaction(() => {
      const s = write({
        id: randomUUID(),
        story: structuredClone(story),
        state: structuredClone(state),
        ...(performance ? { performance: structuredClone(performance) } : {}),
        version: 0,
        updated: new Date().toISOString(),
      });
      checkpoint(s, 'Beginning of this branch');
      return s;
    })();
  const mutate = (
    id: string,
    version: number,
    change: (s: Session) => State,
    label: string,
  ) =>
    db.transaction(() => {
      const s = getSession(id);
      if (s.version !== version)
        throw new Error('This playthrough changed. Reload before continuing.');
      s.state = change(s);
      s.version++;
      s.updated = new Date().toISOString();
      write(s);
      checkpoint(s, label);
      return s;
    })();
  return {
    db,
    getStory,
    getSession,
    create,
    stories: () =>
      db
        .prepare('SELECT body FROM stories')
        .all()
        .map((r) => JSON.parse((r as { body: string }).body) as Story),
    saveStory: (s: Story) => {
      db.prepare('INSERT OR REPLACE INTO stories VALUES (?,?)').run(
        s.id,
        JSON.stringify(s),
      );
      return s;
    },
    sessions: () =>
      db
        .prepare('SELECT body FROM sessions ORDER BY rowid DESC')
        .all()
        .map((r) => JSON.parse((r as { body: string }).body) as Session),
    choose: (id: string, version: number, choice: string) =>
      mutate(
        id,
        version,
        (s) => {
          delete s.performance;
          return advance(s.story, s.state, choice);
        },
        'Decision made',
      ),
    save: (id: string, version: number) =>
      mutate(id, version, (s) => s.state, 'Manual save'),
    remember: (id: string, version: number, text: string, lines: Line[]) =>
      mutate(
        id,
        version,
        (s) => {
          s.performance = { node: s.state.node, lines };
          return {
            ...s.state,
            memories: [...s.state.memories, { scene: s.state.node, text }],
          };
        },
        'Custom response',
      ),
    checkpoints: (id: string) => {
      getSession(id);
      return db
        .prepare(
          'SELECT id,body FROM checkpoints WHERE sessionId=? ORDER BY id DESC',
        )
        .all(id)
        .map((r) => {
          const row = r as { id: number; body: string };
          return { id: row.id, ...JSON.parse(row.body) } as Checkpoint;
        });
    },
    fork: (id: string, checkpointId: number) => {
      const s = getSession(id);
      const row = db
        .prepare('SELECT body FROM checkpoints WHERE id=? AND sessionId=?')
        .get(checkpointId, id) as { body: string } | undefined;
      if (!row) throw new Error('Checkpoint not found');
      const saved = JSON.parse(row.body) as Checkpoint;
      return create(s.story, saved.state, saved.performance);
    },
  };
}
