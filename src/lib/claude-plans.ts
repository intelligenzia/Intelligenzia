// The Claude add-on, in terms that don't touch Stripe, Google or the
// database. Kept free of side-effect imports so it can be tested alone.

import type { MembershipState } from './membership';

export type ClaudeTier = 'STANDARD' | 'PREMIUM';
type Locale = 'fi' | 'en';

/** Monthly price in euros, VAT included. Must match the Stripe prices. */
export const CLAUDE_TIERS: Record<
  ClaudeTier,
  { price: number; label: string; usage: Record<Locale, string> }
> = {
  STANDARD: {
    price: 12,
    label: 'Claude Standard',
    usage: {
      fi: 'Suunnilleen sama käyttömäärä kuin Claude Prossa.',
      en: 'About the same usage as Claude Pro.',
    },
  },
  PREMIUM: {
    price: 50,
    label: 'Claude Premium',
    usage: {
      fi: 'Noin viisi kertaa Standardin käyttömäärä.',
      en: 'About five times the Standard usage.',
    },
  },
};

export const CLAUDE_TIER_ORDER: ClaudeTier[] = ['STANDARD', 'PREMIUM'];

/** Metadata value that marks a Stripe object as the Claude add-on. */
export const CLAUDE_ADDON = 'claude';

export function isClaudeTier(value: unknown): value is ClaudeTier {
  return value === 'STANDARD' || value === 'PREMIUM';
}

/** Metadata the site puts on every Claude checkout and subscription. */
export function isClaudeMetadata(metadata: Record<string, string> | null | undefined): boolean {
  return metadata?.addon === CLAUDE_ADDON;
}

/**
 * Only paid-up members can start the add-on. A failed membership renewal
 * doesn't stop a running Claude subscription (Stripe retries for days), but
 * it doesn't let anyone start a new one either.
 */
export function canStartClaude(membership: MembershipState): boolean {
  return membership.kind === 'active';
}

/**
 * Whether a membership has ended for the purposes of member benefits: the
 * daily check stops Claude renewal and suspends the @intelligenzia.fi
 * address. A failed renewal charge doesn't count; Stripe is still retrying.
 */
export function membershipEnded(membership: MembershipState): boolean {
  return membership.kind === 'none' || membership.kind === 'lapsed';
}

export type ClaudeRecord = {
  tier: ClaudeTier;
  status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

/**
 * What the member page shows.
 * - `none`: never subscribed, an abandoned checkout, or an ended subscription.
 * - `active`: paid up; `ending` when renewal is off.
 * - `payment_issue`: a renewal charge failed.
 */
export type ClaudeState =
  | { kind: 'none' }
  | { kind: 'active'; tier: ClaudeTier; until: Date | null; ending: boolean }
  | { kind: 'payment_issue'; tier: ClaudeTier; until: Date | null };

export function claudeState(record: ClaudeRecord | null | undefined): ClaudeState {
  if (!record) return { kind: 'none' };
  switch (record.status) {
    case 'ACTIVE':
      return {
        kind: 'active',
        tier: record.tier,
        until: record.currentPeriodEnd,
        ending: record.cancelAtPeriodEnd,
      };
    case 'PAST_DUE':
      return { kind: 'payment_issue', tier: record.tier, until: record.currentPeriodEnd };
    default:
      return { kind: 'none' };
  }
}

/** Stripe subscription status -> ours. null: first payment still in flight. */
export function claudeStatusFor(
  status: string
): 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | null {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
    case 'paused':
      return 'PAST_DUE';
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELLED';
    default:
      return null;
  }
}
