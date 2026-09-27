import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';

const base = { MONGODB_URI: 'mongodb://x', JWT_SECRET: 'x'.repeat(32), AI_MODE: 'fake', STORAGE_MODE: 'memory' };

describe('loadEnv', () => {
  it('applies defaults and splits CORS origins', () => {
    const env = loadEnv({ ...base, CORS_ORIGINS: 'http://a.com, http://b.com' });
    expect(env.PORT).toBe(4000);
    expect(env.CORS_ORIGINS).toEqual(['http://a.com', 'http://b.com']);
    expect(env.GEMINI_TEXT_MODEL).toBe('gemini-3.5-flash');
  });
  it('rejects a short JWT secret', () => {
    expect(() => loadEnv({ ...base, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });
  it('requires GEMINI_API_KEY when AI_MODE=gemini', () => {
    expect(() => loadEnv({ ...base, AI_MODE: 'gemini' })).toThrow(/GEMINI_API_KEY/);
  });
  it('requires Cloudinary creds when STORAGE_MODE=cloudinary', () => {
    expect(() => loadEnv({ ...base, STORAGE_MODE: 'cloudinary' })).toThrow(/CLOUDINARY/);
  });
});
