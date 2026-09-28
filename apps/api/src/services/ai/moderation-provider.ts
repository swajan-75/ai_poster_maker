/** Text fields of a poster, keyed by form field name. */
export type ModerationInput = Record<string, string>;
export interface ModerationVerdict { flagged: boolean; reason: string | null }
export interface ModerationProvider { review(input: ModerationInput): Promise<ModerationVerdict> }
