import type { ModerationInput, ModerationProvider, ModerationVerdict } from './moderation-provider.js';

export class FakeModerationProvider implements ModerationProvider {
  calls: ModerationInput[] = [];
  constructor(private readonly behavior: 'clean' | 'flag' | 'fail' = 'clean') {}
  async review(input: ModerationInput): Promise<ModerationVerdict> {
    this.calls.push(input);
    if (this.behavior === 'fail') throw new Error('fake moderation failure');
    return this.behavior === 'flag' ? { flagged: true, reason: 'fake: flagged for review' } : { flagged: false, reason: null };
  }
}
