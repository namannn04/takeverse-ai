import { z } from 'zod';
export const CharacterSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(100),
  role: z.string().max(200),
  personality: z.string().max(2000),
  voiceId: z.string().max(100).default(''),
});
export const LineSchema = z.object({
  character: z.string(),
  text: z.string().min(1).max(2500),
  direction: z.string().max(200).default('quietly'),
  whenFlag: z.string().optional(),
});
export const ChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(300),
  target: z.string(),
  trust: z.record(z.string(), z.number().int().min(-50).max(50)).default({}),
  clue: z.string().optional(),
  flag: z.string().optional(),
  requires: z.string().optional(),
  minTrust: z
    .object({ character: z.string(), value: z.number().int().min(0).max(100) })
    .optional(),
});
export const SceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  location: z.string(),
  prose: z.string().max(8000),
  lines: z.array(LineSchema).max(30),
  choices: z.array(ChoiceSchema).max(10),
  ending: z.string().optional(),
});
export const StorySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1).max(150),
    genre: z.string(),
    synopsis: z.string().max(2000),
    art: z.enum(['coast', 'city', 'forest']),
    duration: z.string(),
    characters: z.array(CharacterSchema).min(1).max(16),
    start: z.string(),
    scenes: z.array(SceneSchema).min(1).max(100),
  })
  .superRefine((s, ctx) => {
    const ids = new Set(s.scenes.map((n) => n.id));
    const cast = new Set(s.characters.map((c) => c.id));
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (ids.size !== s.scenes.length) fail('Scene IDs must be unique');
    if (cast.size !== s.characters.length) fail('Character IDs must be unique');
    if (!ids.has(s.start)) fail('Starting scene is missing');
    for (const n of s.scenes) {
      if (new Set(n.choices.map((c) => c.id)).size !== n.choices.length)
        fail('Choice IDs must be unique within a scene');
      if (!n.ending && !n.choices.length)
        fail(`${n.id}: add choices or an ending`);
      if (n.ending && n.choices.length)
        fail(`${n.id}: an ending cannot also have choices`);
      for (const l of n.lines)
        if (!cast.has(l.character)) fail(`Unknown speaker ${l.character}`);
      for (const c of n.choices) {
        if (!ids.has(c.target)) fail(`Missing target ${c.target}`);
        if (
          Object.keys(c.trust).some((k) => !cast.has(k)) ||
          (c.minTrust && !cast.has(c.minTrust.character))
        )
          fail('Unknown relationship character');
      }
    }
  });
export type Story = z.infer<typeof StorySchema>;
export type Line = z.infer<typeof LineSchema>;
export type State = {
  node: string;
  trust: Record<string, number>;
  flags: string[];
  clues: string[];
  memories: { scene: string; text: string }[];
};
export type Session = {
  id: string;
  story: Story;
  state: State;
  version: number;
  performance?: { node: string; lines: Line[] };
  updated: string;
};
export type Checkpoint = {
  id: number;
  sessionId: string;
  performance?: Session['performance'];
  state: State;
  version: number;
  label: string;
};
