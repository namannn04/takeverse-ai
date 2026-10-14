import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { get } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from './app';
import { createStore } from './store';
import type { Session, Checkpoint } from '../shared/schema';
async function setup(providers?: Parameters<typeof createApp>[1]) {
  const store = createStore(':memory:');
  const server = createApp(store, providers).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const request = async (route: string, method = 'GET', body?: unknown) =>
    fetch(base + route, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  return {
    store,
    request,
    base,
    close: async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      );
      store.db.close();
    },
  };
}

test('HTTP flow: library, choice, stale request, save, resume, replay and validation', async () => {
  const t = await setup();
  try {
    const library = await t.request('/stories');
    assert.equal((await library.json()).length, 3);
    const start = await t.request('/sessions', 'POST', {
      storyId: 'the-last-light',
    });
    assert.equal(start.status, 201);
    const s = (await start.json()) as Session;
    const choice = await t.request(`/sessions/${s.id}/choices`, 'POST', {
      version: 0,
      choiceId: 'honest',
    });
    assert.equal(choice.status, 200);
    assert.equal((await choice.json()).state.trust.mara, 68);
    assert.equal(
      (
        await t.request(`/sessions/${s.id}/choices`, 'POST', {
          version: 0,
          choiceId: 'listen',
        })
      ).status,
      409,
    );
    assert.equal(
      (await t.request(`/sessions/${s.id}/save`, 'POST', { version: 1 }))
        .status,
      200,
    );
    const resumed = await (await t.request(`/sessions/${s.id}`)).json();
    assert.equal(resumed.version, 2);
    const checkpoints = (await (
      await t.request(`/sessions/${s.id}/checkpoints`)
    ).json()) as Checkpoint[];
    const fork = (await (
      await t.request(`/sessions/${s.id}/fork`, 'POST', {
        checkpointId: checkpoints.at(-1)!.id,
      })
    ).json()) as Session;
    assert.notEqual(fork.id, s.id);
    assert.equal(fork.state.node, 'arrival');
    assert.equal(
      (await t.request('/stories/bad', 'PUT', { id: 'bad' })).status,
      400,
    );
    assert.equal((await t.request('/sessions/missing')).status, 404);
    assert.equal((await t.request('/unknown')).status, 404);
    const external = await fetch(t.base + '/stories', {
      headers: { Origin: 'https://example.com' },
    });
    assert.equal(external.status, 403);
    const rebind = await new Promise<number>((resolve, reject) => {
      get(
        t.base + '/stories',
        { headers: { Host: 'untrusted.example' } },
        (res) => {
          res.resume();
          resolve(res.statusCode!);
        },
      ).on('error', reject);
    });
    assert.equal(rebind, 403);
  } finally {
    await t.close();
  }
});

test('HTTP provider integration persists director lines and routes their character voice (mock provider)', async () => {
  let voiced = '';
  const t = await setup({
    direct: async () => [
      {
        character: 'mara',
        text: 'I remember your promise.',
        direction: 'warmly',
      },
    ],
    speech: async (line, voice) => {
      voiced = line.text + '|' + voice;
      return Buffer.from('mock audio for route contract');
    },
  });
  try {
    const s = (await (
      await t.request('/sessions', 'POST', { storyId: 'the-last-light' })
    ).json()) as Session;
    const result = await t.request(`/sessions/${s.id}/direct`, 'POST', {
      version: 0,
      text: 'I will stay.',
    });
    assert.equal(result.status, 200);
    const updated = await result.json();
    assert.equal(updated.session.state.memories[0].text, 'I will stay.');
    const audio = await t.request(`/sessions/${s.id}/audio`, 'POST', {
      version: 1,
      lineIndex: 0,
    });
    assert.equal(audio.status, 200);
    assert.match(audio.headers.get('content-type') ?? '', /audio\/mpeg/);
    assert.match(voiced, /I remember your promise/);
    assert.match(voiced, /c70cfb98867a4bfb9ae20d2401257b92/);
    assert.equal(
      (
        await t.request(`/sessions/${s.id}/audio`, 'POST', {
          version: 0,
          lineIndex: 0,
        })
      ).status,
      409,
    );
  } finally {
    await t.close();
  }
});

test('provider failures do not fabricate dialogue, speech or mutate memories', async () => {
  const t = await setup({
    direct: async () => {
      throw new Error('AI director returned 503');
    },
    speech: async () => {
      throw new Error('Fish Audio returned 401');
    },
  });
  try {
    const s = (await (
      await t.request('/sessions', 'POST', { storyId: 'the-last-light' })
    ).json()) as Session;
    const failed = await t.request(`/sessions/${s.id}/direct`, 'POST', {
      version: 0,
      text: 'Hello',
    });
    assert.equal(failed.status, 400);
    const audio = await t.request(`/sessions/${s.id}/audio`, 'POST', {
      version: 0,
      lineIndex: 0,
    });
    assert.equal(audio.status, 400);
    assert.match((await audio.json()).error, /401/);
    assert.equal(t.store.getSession(s.id).version, 0);
    assert.equal(t.store.getSession(s.id).state.memories.length, 0);
  } finally {
    await t.close();
  }
});

test('a late director response cannot overwrite a newer choice', async () => {
  let finish!: (
    lines: { character: string; text: string; direction: string }[],
  ) => void;
  let started!: () => void;
  const pending = new Promise<
    { character: string; text: string; direction: string }[]
  >((resolve) => (finish = resolve));
  const began = new Promise<void>((resolve) => (started = resolve));
  const t = await setup({
    direct: async () => {
      started();
      return pending;
    },
    speech: async () => Buffer.alloc(0),
  });
  try {
    const s = (await (
      await t.request('/sessions', 'POST', { storyId: 'the-last-light' })
    ).json()) as Session;
    const response = t.request(`/sessions/${s.id}/direct`, 'POST', {
      version: 0,
      text: 'Wait',
    });
    await began;
    await t.request(`/sessions/${s.id}/choices`, 'POST', {
      version: 0,
      choiceId: 'honest',
    });
    finish([
      { character: 'mara', text: 'Late response', direction: 'quietly' },
    ]);
    assert.equal((await response).status, 409);
    assert.equal(t.store.getSession(s.id).state.node, 'evidence');
    assert.equal(t.store.getSession(s.id).performance, undefined);
  } finally {
    await t.close();
  }
});
