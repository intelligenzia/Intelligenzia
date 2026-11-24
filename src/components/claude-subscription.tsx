'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Loader2, Settings } from 'lucide-react';
import { CONTACT_EMAIL, routeFor } from '@/lib/membership';
import { CLAUDE_TIERS, CLAUDE_TIER_ORDER, type ClaudeTier } from '@/lib/claude-plans';

async function redirectTo(endpoint: string, body: object): Promise<string | null> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) return typeof data.error === 'string' ? data.error : 'failed';
  window.location.href = data.url;
  return null;
}

/** Tier choice, terms and the button to Stripe Checkout. */
export function ClaudeSubscribe({ locale }: { locale: string }) {
  const fi = locale === 'fi';
  const [tier, setTier] = useState<ClaudeTier>('STANDARD');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors: Record<string, string> = fi
    ? {
        not_member: 'Claude on vain jäsenille, joilla on voimassa oleva jäsenyys.',
        already_subscribed: 'Sinulla on jo Claude-tilaus.',
        no_address: 'Luo ensin @intelligenzia.fi-osoitteesi.',
        terms_required: 'Hyväksy käyttöehdot ensin.',
        failed: `Maksun aloittaminen epäonnistui. Yritä uudelleen tai kirjoita ${CONTACT_EMAIL}.`,
      }
    : {
        not_member: 'Claude is only for members with an active membership.',
        already_subscribed: 'You already have a Claude subscription.',
        no_address: 'Create your @intelligenzia.fi address first.',
        terms_required: 'Accept the terms first.',
        failed: `Couldn't start the payment. Try again or write to ${CONTACT_EMAIL}.`,
      };

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const problem = await redirectTo('/api/claude/checkout', { tier, locale, acceptTerms: accepted });
      if (problem) {
        setError(errors[problem] ?? errors.failed);
        setBusy(false);
      }
    } catch {
      setError(errors.failed);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <RadioGroup
        value={tier}
        onValueChange={(v) => setTier(v as ClaudeTier)}
        className="grid gap-3 sm:grid-cols-2"
        aria-label={fi ? 'Valitse taso' : 'Choose a tier'}
      >
        {CLAUDE_TIER_ORDER.map((t) => (
          <Label
            key={t}
            htmlFor={`claude-${t}`}
            className="flex cursor-pointer items-start gap-3 rounded-md border p-4 has-[[data-state=checked]]:border-primary"
          >
            <RadioGroupItem id={`claude-${t}`} value={t} className="mt-1" />
            <span className="space-y-1">
              <span className="block font-semibold">{CLAUDE_TIERS[t].label}</span>
              <span className="block font-mono text-sm tabular-nums">
                {CLAUDE_TIERS[t].price} € / {fi ? 'kk' : 'month'}
              </span>
              <span className="block text-sm font-normal text-muted-foreground">
                {CLAUDE_TIERS[t].usage[fi ? 'fi' : 'en']}
              </span>
            </span>
          </Label>
        ))}
      </RadioGroup>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        <span>
          {fi ? 'Hyväksyn ' : 'I accept the '}
          <Link href={routeFor(locale, 'claude')} className="underline underline-offset-4">
            {fi ? 'Claude-lisäpalvelun käyttöehdot' : 'Claude add-on terms'}
          </Link>
          .
        </span>
      </label>

      <Button onClick={start} disabled={!accepted || busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {busy ? (fi ? 'Avataan maksua…' : 'Opening payment…') : fi ? 'Siirry maksamaan' : 'Continue to payment'}
        {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Opens the billing portal for the Claude subscription. */
export function ClaudeManageButton({ locale, label }: { locale: string; label?: string }) {
  const fi = locale === 'fi';
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const open = async () => {
    setBusy(true);
    setFailed(false);
    try {
      if (await redirectTo('/api/claude/portal', { locale })) {
        setFailed(true);
        setBusy(false);
      }
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button variant={label ? 'default' : 'outline'} onClick={open} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
        {label ?? (fi ? 'Maksutapa, kuitit ja tilauksen lopetus' : 'Card, receipts and cancelling')}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {fi
            ? `Tilauksen hallintaa ei voitu avata. Yritä uudelleen tai kirjoita ${CONTACT_EMAIL}.`
            : `Couldn't open subscription management. Try again or write to ${CONTACT_EMAIL}.`}
        </p>
      )}
    </div>
  );
}
