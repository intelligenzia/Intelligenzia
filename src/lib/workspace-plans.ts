// The @intelligenzia.fi address benefit, in terms that don't touch Google or
// the database. Kept free of side-effect imports so it can be tested alone.

import type { MembershipState } from './membership';

/** Any paid-up member, full or supporting, can take an address. */
export function canClaimAddress(membership: MembershipState): boolean {
  return membership.kind === 'active';
}

/** Days a suspended address is kept before it is deleted. */
export const WORKSPACE_GRACE_DAYS = 30;

export const LOCAL_PART_MIN = 3;
export const LOCAL_PART_MAX = 30;

/**
 * Addresses members can't take: the association's roles and shared inboxes,
 * mail-system names, and anything that would look official.
 */
const RESERVED = new Set([
  'abuse', 'admin', 'administrator', 'billing', 'claude', 'contact', 'help',
  'hallitus', 'hostmaster', 'info', 'intelligenzia', 'jasen', 'jasenet',
  'jasenasiat', 'jasenrekisteri', 'kirjasto', 'laskutus', 'mail', 'mailer-daemon',
  'no-reply', 'noreply', 'postmaster', 'privacy', 'puheenjohtaja', 'pj',
  'rahastonhoitaja', 'root', 'security', 'sihteeri', 'support', 'tiedotus',
  'tietosuoja', 'tuki', 'varapuheenjohtaja', 'vpj', 'viestinta', 'webmaster',
  'www', 'yhdenvertaisuus', 'yhdenvertaisuusvastaava',
]);

export type LocalPartProblem = 'too_short' | 'too_long' | 'characters' | 'edges' | 'dots' | 'reserved';

/** Trims and lowercases what the member typed; doesn't fix anything else. */
export function normalizeLocalPart(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Whether a (normalized) local part is acceptable. Letters a–z, digits, and
 * . - _ in between; Google's own rules plus our reserved names.
 */
export function checkLocalPart(local: string): LocalPartProblem | null {
  if (local.length < LOCAL_PART_MIN) return 'too_short';
  if (local.length > LOCAL_PART_MAX) return 'too_long';
  if (!/^[a-z0-9._-]+$/.test(local)) return 'characters';
  if (!/^[a-z0-9].*[a-z0-9]$/.test(local)) return 'edges';
  if (/[._-]{2,}/.test(local)) return 'dots';
  if (RESERVED.has(local) || RESERVED.has(local.replace(/[._-]/g, ''))) return 'reserved';
  return null;
}

export const localPartMessages: Record<LocalPartProblem | 'taken', { fi: string; en: string }> = {
  too_short: { fi: `Vähintään ${LOCAL_PART_MIN} merkkiä.`, en: `At least ${LOCAL_PART_MIN} characters.` },
  too_long: { fi: `Enintään ${LOCAL_PART_MAX} merkkiä.`, en: `At most ${LOCAL_PART_MAX} characters.` },
  characters: {
    fi: 'Käytä vain kirjaimia a–z, numeroita sekä merkkejä . - _',
    en: 'Use only letters a–z, digits and . - _',
  },
  edges: { fi: 'Alun ja lopun on oltava kirjain tai numero.', en: 'Start and end with a letter or digit.' },
  dots: { fi: 'Erikoismerkit eivät voi olla peräkkäin.', en: "Special characters can't be next to each other." },
  reserved: { fi: 'Tämä osoite on varattu yhdistyksen käyttöön.', en: 'This address is reserved for the association.' },
  taken: { fi: 'Osoite on jo käytössä.', en: 'That address is taken.' },
};

/** Lowercase ASCII letters and digits only: "Väätäjä" -> "vaataja". */
function slug(part: string): string {
  return part
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * A suggestion for the address field: etunimi.sukunimi from the member's
 * name (first and last word, so middle names don't make it long), else the
 * start of their own email.
 */
export function suggestLocalPart(name: string | null | undefined, fallbackEmail: string): string {
  const words = (name ?? '')
    .split(/[\s-]+/)
    .map(slug)
    .filter(Boolean);
  const base =
    words.length >= 2
      ? `${words[0]}.${words[words.length - 1]}`
      : words[0] ?? (slug(fallbackEmail.split('@')[0]) || 'jasen');
  const cut = base.slice(0, LOCAL_PART_MAX).replace(/[._-]+$/, '');
  return checkLocalPart(cut) === null ? cut : '';
}

/** A temporary password Google accepts: 16 characters from a safe alphabet. */
export function temporaryPassword(randomInt: (max: number) => number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 16 }, () => alphabet[randomInt(alphabet.length)]).join('');
}
