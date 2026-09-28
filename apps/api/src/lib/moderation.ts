// Starter list — extend with the client. Matching is substring on NFC-normalized, lowercased text.
// This is a fast, deterministic first pass; the AI moderation check (gemini-moderation-provider.ts)
// catches everything more contextual (defamation, disguised spellings, communal incitement, etc.).
const BLOCKED_TERMS = [
  // Violence / threats / terrorism (English)
  'kill', 'murder', 'rape', 'terrorist', 'terrorism', 'behead', 'beheading', 'lynch', 'genocide',
  'massacre', 'bomb blast', 'suicide attack', 'gun down', 'slaughter',
  // Violence / threats / terrorism (Bangla)
  'হত্যা করো', 'খুন করো', 'জবাই করো', 'ধর্ষণ', 'জঙ্গি', 'সন্ত্রাসী', 'গণহত্যা', 'কুপিয়ে হত্যা',
  'জ্বালিয়ে দাও', 'গুলি করো', 'বোমা মেরে', 'রগ কেটে',
  // Slurs / abusive language (English)
  'bastard', 'bitch', 'whore', 'slut', 'motherfucker', 'fuck you', 'fucker', 'asshole',
  // Slurs / abusive language (Bangla)
  'কুত্তার বাচ্চা', 'শুয়োরের বাচ্চা', 'মাগীর পোলা', 'খানকির পোলা', 'খানকি', 'মাদারচোদ',
  'বেশ্যা', 'শুয়োরের বাচ্চারা', 'হারামজাদা', 'হারামির বাচ্চা', 'চুদির ভাই', 'চুতিয়া',
];
const normalized = BLOCKED_TERMS.map((t) => t.normalize('NFC').toLowerCase());

export function findBlockedTerm(text: string): string | null {
  const hay = text.normalize('NFC').toLowerCase();
  const i = normalized.findIndex((t) => hay.includes(t));
  return i === -1 ? null : BLOCKED_TERMS[i]!;
}
