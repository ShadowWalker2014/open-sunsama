import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z as z3 } from 'zod/v3';
import { createTaskSchema, taskFilterSchema } from './tasks.js';
import { caldavConnectSchema } from './calendar.js';

// Exercise the same validator used by the routes: it sends its own 400 response
// rather than throwing through apps/api/src/middleware/error.ts.
const app = new Hono();
app.post('/tasks', zValidator('json', createTaskSchema), (c) => c.json({ success: true }));
app.get('/tasks', zValidator('query', taskFilterSchema), (c) => c.json({ success: true }));

async function validationMessages(response: Response) {
  expect(response.status).toBe(400);
  const body = (await response.json()) as {
    success: boolean;
    error: { name: string; message: string };
  };
  expect(body.success).toBe(false);
  expect(body.error.name).toBe('ZodError');
  return JSON.parse(body.error.message) as Array<{ path: string[]; message: string }>;
}

describe('Zod 4 route validation responses', () => {
  it('uses a useful message for a missing task title', async () => {
    const before = z3.object({ title: z3.string().min(1, 'Title is required') }).safeParse({});
    expect(before.success).toBe(false);
    if (!before.success) expect(before.error.issues[0]?.message).toBe('Required');

    const response = await app.request('/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(await validationMessages(response)).toMatchObject([
      { path: ['title'], message: 'Title is required' },
    ]);
  });

  it('retains the custom message for an empty title', async () => {
    const response = await app.request('/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    expect(await validationMessages(response)).toMatchObject([
      { path: ['title'], message: 'Title is required' },
    ]);
  });

  it('keeps the type error for a non-string title', async () => {
    const response = await app.request('/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 123 }),
    });
    expect(await validationMessages(response)).toMatchObject([
      { path: ['title'], message: 'Invalid input: expected string, received number' },
    ]);
  });

  it('retains the custom messages for an invalid task date', async () => {
    const before = z3.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in yyyy-MM-dd format')
      .refine((value) => !isNaN(new Date(value).getTime()), { message: 'Invalid date' })
      .safeParse('tomorrow');
    expect(before.success).toBe(false);
    if (!before.success) {
      expect(before.error.issues.map((issue) => issue.message)).toEqual([
        'Date must be in yyyy-MM-dd format', 'Invalid date',
      ]);
    }

    const response = await app.request('/tasks?date=tomorrow');
    expect(await validationMessages(response)).toMatchObject([
      { path: ['date'], message: 'Date must be in yyyy-MM-dd format' },
      { path: ['date'], message: 'Invalid date' },
    ]);
  });

  it('accepts a normal calendar email and URL and rejects malformed ones', () => {
    const valid = {
      email: 'person+calendar@example.com',
      appPassword: 'secret',
      caldavUrl: 'https://calendar.example.com/dav/',
    };
    expect(caldavConnectSchema.safeParse(valid).success).toBe(true);
    expect(caldavConnectSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
    expect(caldavConnectSchema.safeParse({ ...valid, caldavUrl: 'not-a-url' }).success).toBe(false);
  });
});
