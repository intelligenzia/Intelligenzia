/** Annual fee for a full membership, in euros. */
export const FULL_PRICE = 10;

/** Floor for a supporting (pay-what-you-want) membership, in euros. */
export const MIN_SUPPORTING_PRICE = 10;

/** Ceiling for a supporting membership, in euros. Guards against typos. */
export const MAX_SUPPORTING_PRICE = 10_000;

/** Presets offered alongside the free-form supporting amount. */
export const SUPPORTING_PRESETS = [10, 20, 50, 100];

/** How long before expiry a one-off membership can be renewed early. */
export const RENEWAL_WINDOW_DAYS = 60;

export const CONTACT_EMAIL = 'hallitus@intelligenzia.fi';

export type MembershipType = 'FULL' | 'SUPPORTING';
type Locale = 'fi' | 'en';

export const typeLabels: Record<MembershipType, Record<Locale, string>> = {
  FULL: { fi: 'Varsinainen jäsen', en: 'Full member' },
  SUPPORTING: { fi: 'Kannatusjäsen', en: 'Supporting member' },
};

// Locale-less hrefs for next-intl's <Link>; use localePath() for redirects
// and absolute URLs, where the /en prefix has to be spelled out.
const routes = {
  join: { fi: '/jaseneksi', en: '/join' },
  thanks: { fi: '/jaseneksi/kiitos', en: '/join/thanks' },
  dashboard: { fi: '/jasenyys', en: '/my-membership' },
  login: { fi: '/kirjaudu', en: '/login' },
  verify: { fi: '/kirjaudu/tarkista', en: '/login/verify' },
  confirm: { fi: '/kirjaudu/vahvista', en: '/login/confirm' },
} as const;

export type MembershipRoute = keyof typeof routes;

function asLocale(locale: string): Locale {
  return locale === 'en' ? 'en' : 'fi';
}

export function routeFor(locale: string, route: MembershipRoute): string {
  return routes[route][asLocale(locale)];
}

export function localePath(locale: string, route: MembershipRoute): string {
  const path = routeFor(locale, route);
  return asLocale(locale) === 'en' ? `/en${path}` : path;
}

/** Login URL that returns to `back` (a localePath) after the magic link. */
export function loginPath(locale: string, back: string, email?: string): string {
  const params = new URLSearchParams({ callbackUrl: back });
  if (email) params.set('email', email);
  return `${localePath(locale, 'login')}?${params}`;
}

export type MembershipRecord = {
  type: MembershipType;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  currentPeriodEnd: Date | null;
  stripeSubscriptionId: string | null;
};

/**
 * What a member is, in the terms the UI and checkout care about.
 *
 * - `none`: never paid. A PENDING row only means a checkout was started and
 *   abandoned, so it is not a membership.
 * - `active`: paid up. `recurring` is a live Stripe subscription; otherwise
 *   it is a one-off period that ends at `until`.
 * - `payment_issue`: a subscription whose renewal charge failed. Fixed in the
 *   billing portal, never by buying a second membership.
 * - `lapsed`: was a member, period is over.
 */
export type MembershipState =
  | { kind: 'none'; abandoned: boolean }
  | { kind: 'active'; type: MembershipType; recurring: boolean; until: Date | null }
  | { kind: 'payment_issue'; type: MembershipType; until: Date | null }
  | { kind: 'lapsed'; type: MembershipType; endedAt: Date | null };

export function membershipState(
  membership: MembershipRecord | null | undefined,
  now = new Date()
): MembershipState {
  if (!membership || membership.status === 'PENDING') {
    return { kind: 'none', abandoned: !!membership };
  }

  const { type, status, currentPeriodEnd: until } = membership;
  const recurring = type === 'FULL' && !!membership.stripeSubscriptionId;

  if (recurring) {
    // Stripe owns the lifecycle of a subscription; trust its status rather
    // than the period end, which is briefly in the past while a renewal runs.
    if (status === 'ACTIVE') return { kind: 'active', type, recurring, until };
    if (status === 'EXPIRED') return { kind: 'payment_issue', type, until };
    return { kind: 'lapsed', type, endedAt: until };
  }

  // One-off payments have no renewal webhook: a past period end is the only
  // signal that they have lapsed.
  if (status === 'ACTIVE' && (!until || until > now)) {
    return { kind: 'active', type, recurring, until };
  }
  return { kind: 'lapsed', type, endedAt: until };
}

/** Days until a one-off membership can be renewed; 0 means it can be now. */
export function daysUntilRenewalOpens(until: Date | null, now = new Date()): number {
  if (!until) return 0;
  const opens = until.getTime() - RENEWAL_WINDOW_DAYS * 86_400_000;
  return Math.max(0, Math.ceil((opens - now.getTime()) / 86_400_000));
}

export type CheckoutPlan =
  | {
      ok: true;
      /** One-off renewals extend from here instead of from the payment date. */
      periodStart?: Date;
      /** Upgrades start the subscription now but bill when the old period ends. */
      trialEnd?: Date;
    }
  | { ok: false; reason: 'already_member' | 'renewal_not_open'; opensInDays?: number };

// Stripe rejects a trial_end less than 48 hours away.
const MIN_TRIAL_MS = 49 * 60 * 60 * 1000;

/** Whether, and on what terms, someone in `state` can buy `requested`. */
export function planCheckout(
  state: MembershipState,
  requested: MembershipType,
  now = new Date()
): CheckoutPlan {
  if (state.kind === 'none' || state.kind === 'lapsed') return { ok: true };
  if (state.kind === 'payment_issue' || state.recurring) {
    return { ok: false, reason: 'already_member' };
  }

  // Active one-off period from here on.
  const { until } = state;
  const trialEnd =
    until && until.getTime() - now.getTime() > MIN_TRIAL_MS ? until : undefined;

  // Supporting -> full is always allowed; billing starts when the paid
  // supporting period ends, so nobody pays twice for the same months.
  if (requested === 'FULL' && state.type === 'SUPPORTING') {
    return { ok: true, trialEnd };
  }

  const opensInDays = daysUntilRenewalOpens(until, now);
  if (opensInDays > 0) return { ok: false, reason: 'renewal_not_open', opensInDays };

  return requested === 'FULL'
    ? { ok: true, trialEnd }
    : { ok: true, periodStart: until ?? undefined };
}

export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fi-FI', {
    day: 'numeric',
    month: locale === 'en' ? 'long' : 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatEuros(euros: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'fi-FI', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: Number.isInteger(euros) ? 0 : 2,
  }).format(euros);
}
