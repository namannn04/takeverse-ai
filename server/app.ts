import express from 'express';
import { z } from 'zod';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { StorySchema } from '../shared/schema';
import { createStore } from './store';
import { performanceLines } from './engine';
import { direct, speech } from './providers';
export function createApp(
  store: ReturnType<typeof createStore>,
  providers = { direct, speech },
) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (!['127.0.0.1', 'localhost'].includes(req.hostname)) {
      res.status(403).json({ error: 'Only local hosts are allowed' });
      return;
    }
    if (origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      res.status(403).json({ error: 'Only local origins are allowed' });
      return;
    }
    next();
  });
  app.get('/api/status', (_req, res) =>
    res.json({
      fish: !!process.env.FISH_API_KEY,
      director: !!process.env.LLM_API_KEY,
      model: 'drama-3',
    }),
  );
  app.get('/api/stories', (_req, res) => res.json(store.stories()));
  app.put('/api/stories/:id', (req, res) => {
    const story = StorySchema.parse(req.body);
    if (story.id !== req.params.id) throw new Error('Story ID mismatch');
    res.json(store.saveStory(story));
  });
  app.get('/api/sessions', (_req, res) => res.json(store.sessions()));
  app.post('/api/sessions', (req, res) =>
    res
      .status(201)
      .json(
        store.create(
          store.getStory(
            z.object({ storyId: z.string() }).parse(req.body).storyId,
          ),
        ),
      ),
  );
  app.get('/api/sessions/:id', (req, res) =>
    res.json(store.getSession(req.params.id)),
  );
  const version = z.number().int().nonnegative();
  app.post('/api/sessions/:id/choices', (req, res) => {
    const body = z.object({ version, choiceId: z.string() }).parse(req.body);
    res.json(store.choose(req.params.id, body.version, body.choiceId));
  });
  app.post('/api/sessions/:id/save', (req, res) =>
    res.json(
      store.save(req.params.id, z.object({ version }).parse(req.body).version),
    ),
  );
  app.get('/api/sessions/:id/checkpoints', (req, res) =>
    res.json(store.checkpoints(req.params.id)),
  );
  app.post('/api/sessions/:id/fork', (req, res) =>
    res
      .status(201)
      .json(
        store.fork(
          req.params.id,
          z.object({ checkpointId: z.number().int() }).parse(req.body)
            .checkpointId,
        ),
      ),
  );
  app.post('/api/sessions/:id/direct', async (req, res) => {
    const b = z
      .object({ version, text: z.string().min(1).max(1000) })
      .parse(req.body);
    const s = store.getSession(req.params.id);
    if (s.version !== b.version)
      throw new Error('This playthrough changed. Reload before continuing.');
    if (s.story.scenes.find((n) => n.id === s.state.node)?.ending)
      throw new Error('This story has ended. Replay a checkpoint to continue.');
    const lines = await providers.direct(s, b.text);
    const session = store.remember(s.id, b.version, b.text, lines);
    res.json({ session, lines });
  });
  app.post('/api/sessions/:id/audio', async (req, res) => {
    const b = z
      .object({ lineIndex: z.number().int().nonnegative(), version })
      .parse(req.body);
    const s = store.getSession(req.params.id);
    if (s.version !== b.version)
      throw new Error('This playthrough changed. Reload before continuing.');
    const line = performanceLines(s)[b.lineIndex];
    if (!line) throw new Error('Dialogue line not found');
    const voice =
      s.story.characters.find((c) => c.id === line.character)?.voiceId ||
      process.env.FISH_REFERENCE_ID ||
      '';
    res.type('audio/mpeg').send(await providers.speech(line, voice));
  });
  app.use('/api', (_req, res) =>
    res.status(404).json({ error: 'API route not found' }),
  );
  if (existsSync('dist')) {
    app.use(express.static('dist'));
    app.get('/{*path}', (_req, res) =>
      res.sendFile(path.resolve('dist/index.html')),
    );
  }
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: error.issues.map((i) => i.message).join('; ') });
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Unexpected server error';
      res
        .status(
          message.includes('not found')
            ? 404
            : message.includes('changed')
              ? 409
              : 400,
        )
        .json({ error: message });
    },
  );
  return app;
}
