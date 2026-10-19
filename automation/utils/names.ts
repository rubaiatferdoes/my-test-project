/**
 * Unique, traceable names for everything discovery creates.
 * Pattern: qa-<seq>-<time in base 36>-<4 random characters> (CLAUDE.md section 4).
 */
export function qaName(seq: string): string {
  const slug = seq.toLowerCase().replace(/[^a-z0-9]/g, '');
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `qa-${slug}-${time}-${random}`;
}
