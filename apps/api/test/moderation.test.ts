import { describe, expect, it } from 'vitest';
import { findBlockedTerm } from '../src/lib/moderation.js';

describe('findBlockedTerm', () => {
  it('passes normal political greetings', () => {
    expect(findBlockedTerm('মহান বিজয় দিবসের শুভেচ্ছা')).toBeNull();
  });
  it('flags blocked terms case-insensitively and after NFC normalization', () => {
    expect(findBlockedTerm('We will KILL them')).toBe('kill');
    expect(findBlockedTerm('ওদের হত্যা করো')).toBe('হত্যা করো');
  });
});
