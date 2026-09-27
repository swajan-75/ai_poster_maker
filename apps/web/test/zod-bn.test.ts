import { describe, expect, it } from 'vitest';
import { posterFormSchema, registerSchema } from '@poster/shared';

describe('Bangla zod messages', () => {
  it('too_small / too_big / email', () => {
    const r = registerSchema.safeParse({ name: 'a', email: 'bad', password: 'x'.repeat(80) });
    const msgs = r.success ? [] : r.error.issues.map((i) => i.message);
    expect(msgs).toEqual(expect.arrayContaining(['কমপক্ষে ২ অক্ষর লিখুন', 'সঠিক ইমেইল ঠিকানা দিন', 'সর্বোচ্চ ৭২ অক্ষর']));
  });
  it('control characters', () => {
    const r = posterFormSchema.shape.name.safeParse('ab\u0007c');
    expect(r.success ? '' : r.error.issues[0]!.message).toBe('অবৈধ অক্ষর রয়েছে');
  });
});
