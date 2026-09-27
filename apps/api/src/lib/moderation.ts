// Starter list — extend with the client. Matching is substring on NFC-normalized, lowercased text.
const BLOCKED_TERMS = [
  'kill', 'murder', 'rape', 'terrorist', 'behead',
  'হত্যা করো', 'খুন করো', 'জবাই করো', 'ধর্ষণ', 'জঙ্গি', 'কুত্তার বাচ্চা', 'শুয়োরের বাচ্চা',
];
const normalized = BLOCKED_TERMS.map((t) => t.normalize('NFC').toLowerCase());

export function findBlockedTerm(text: string): string | null {
  const hay = text.normalize('NFC').toLowerCase();
  const i = normalized.findIndex((t) => hay.includes(t));
  return i === -1 ? null : BLOCKED_TERMS[i]!;
}
