import { test } from 'node:test';
import assert from 'node:assert/strict';
import { direct, speech } from './providers';
import { createStore } from './store';
import { seeds } from './stories';

test('unconfigured providers fail explicitly before making network calls', async () => {
  const fish = process.env.FISH_API_KEY,
    llm = process.env.LLM_API_KEY;
  delete process.env.FISH_API_KEY;
  delete process.env.LLM_API_KEY;
  const store = createStore(':memory:');
  try {
    await assert.rejects(
      () =>
        speech({ character: 'mara', text: 'Hello', direction: 'quietly' }, ''),
      /not configured/,
    );
    await assert.rejects(
      () => direct(store.create(seeds[0]), 'Hello'),
      /not configured/,
    );
  } finally {
    if (fish !== undefined) process.env.FISH_API_KEY = fish;
    if (llm !== undefined) process.env.LLM_API_KEY = llm;
    store.db.close();
  }
});

test('director validates actual response parsing and rejects unknown speakers (mock HTTP)', async () => {
  const original = globalThis.fetch,
    old = process.env.LLM_API_KEY;
  process.env.LLM_API_KEY = 'unit-test-only';
  const store = createStore(':memory:');
  const session = store.create(seeds[0]);
  try {
    let payload: Record<string, unknown> = {};
    globalThis.fetch = async (_url, options) => {
      payload = JSON.parse(options!.body as string);
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  lines: [
                    {
                      character: 'mara',
                      text: 'You returned.',
                      direction: 'relieved',
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      );
    };
    const lines = await direct(session, 'I came back.');
    assert.equal(lines[0].text, 'You returned.');
    assert.equal(
      payload.response_format && typeof payload.response_format,
      'object',
    );
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  lines: [
                    {
                      character: 'intruder',
                      text: 'No.',
                      direction: 'quietly',
                    },
                  ],
                }),
              },
            },
          ],
        }),
      );
    await assert.rejects(() => direct(session, 'Hello'), /unknown character/);
    globalThis.fetch = async () =>
      new Response('Service unavailable', { status: 503 });
    await assert.rejects(() => direct(session, 'Hello'), /503/);
    assert.equal(store.getSession(session.id).state.memories.length, 0);
  } finally {
    globalThis.fetch = original;
    if (old === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = old;
    store.db.close();
  }
});
