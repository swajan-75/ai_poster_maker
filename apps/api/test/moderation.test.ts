import { describe, expect, it } from 'vitest';
import { findBlockedTerm } from '../src/lib/moderation.js';
import { GeminiModerationProvider } from '../src/services/ai/gemini-moderation-provider.js';

describe('findBlockedTerm', () => {
  it('passes normal political greetings', () => {
    expect(findBlockedTerm('মহান বিজয় দিবসের শুভেচ্ছা')).toBeNull();
  });
  it('flags blocked terms case-insensitively and after NFC normalization', () => {
    expect(findBlockedTerm('We will KILL them')).toBe('kill');
    expect(findBlockedTerm('ওদের হত্যা করো')).toBe('হত্যা করো');
  });
});

describe('GeminiModerationProvider', () => {
  const overloaded = () => Object.assign(new Error('high demand'), { status: 503 });
  const clean = { text: '{"flagged":false,"reason":""}' };

  function client(results: Array<object | Error>) {
    const models: string[] = [];
    return {
      models,
      client: {
        models: {
          generateContent: async (args: unknown) => {
            models.push((args as { model: string }).model);
            const r = results.shift();
            if (!r) throw new Error('unexpected call');
            if (r instanceof Error) throw r;
            return r;
          },
        },
      },
    };
  }

  it('retries the same model once when it is overloaded', async () => {
    const c = client([overloaded(), clean]);
    const p = new GeminiModerationProvider(c.client, ['main', 'lite'], 0);
    await expect(p.review({ headline: 'ঈদ মোবারক' })).resolves.toEqual({ flagged: false, reason: null });
    expect(c.models).toEqual(['main', 'main']);
  });

  it('falls back to the next model when the main one stays overloaded', async () => {
    const c = client([overloaded(), overloaded(), { text: '{"flagged":true,"reason":"hate speech"}' }]);
    const p = new GeminiModerationProvider(c.client, ['main', 'lite'], 0);
    await expect(p.review({ headline: 'x' })).resolves.toEqual({ flagged: true, reason: 'hate speech' });
    expect(c.models).toEqual(['main', 'main', 'lite']);
  });

  it('moves to the next model without retrying on a non-transient error', async () => {
    const c = client([{ text: 'not json' }, clean]);
    const p = new GeminiModerationProvider(c.client, ['main', 'lite'], 0);
    await expect(p.review({ headline: 'x' })).resolves.toEqual({ flagged: false, reason: null });
    expect(c.models).toEqual(['main', 'lite']);
  });

  it('throws the last error when every model fails', async () => {
    const c = client([overloaded(), overloaded(), overloaded(), overloaded()]);
    const p = new GeminiModerationProvider(c.client, ['main', 'lite'], 0);
    await expect(p.review({ headline: 'x' })).rejects.toThrow('high demand');
    expect(c.models).toEqual(['main', 'main', 'lite', 'lite']);
  });
});
