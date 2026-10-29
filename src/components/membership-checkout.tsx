'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Minus, Loader2, ArrowRight, Lock } from 'lucide-react';
import {
  CONTACT_EMAIL,
  FULL_PRICE,
  MAX_SUPPORTING_PRICE,
  MIN_SUPPORTING_PRICE,
  SUPPORTING_PRESETS,
  type MembershipType,
} from '@/lib/membership';

/** Per-option availability, worked out on the server for signed-in members. */
export type CheckoutOptions = Partial<Record<MembershipType, { disabled?: boolean; note?: string }>>;

type Props = {
  locale: string;
  options?: CheckoutOptions;
  initialType?: MembershipType;
  initialAmount?: number;
  signedIn?: boolean;
};

export function MembershipCheckout({ locale, options = {}, initialType, initialAmount, signedIn }: Props) {
  const available = (type: MembershipType) => !options[type]?.disabled;
  const [membershipType, setMembershipType] = useState<MembershipType>(() => {
    const wanted = initialType ?? 'FULL';
    if (available(wanted)) return wanted;
    return wanted === 'FULL' ? 'SUPPORTING' : 'FULL';
  });
  // Kept as the raw input string so typing "25" isn't clamped to 10 after
  // the first keystroke; validated on submit instead.
  const [amountInput, setAmountInput] = useState<string>(
    String(
      initialAmount && Number.isInteger(initialAmount) && initialAmount >= MIN_SUPPORTING_PRICE
        ? initialAmount
        : MIN_SUPPORTING_PRICE
    )
  );
  const customAmount = Number(amountInput);
  const amountValid =
    Number.isInteger(customAmount) &&
    customAmount >= MIN_SUPPORTING_PRICE &&
    customAmount <= MAX_SUPPORTING_PRICE;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    fi: {
      fullTitle: 'Varsinainen jäsen',
      fullDescription: 'Kognitiotieteen pää- tai sivuaineopiskelijoille ja valmistuneille. Äänioikeus yhdistyksen kokouksissa.',
      supportingTitle: 'Kannatusjäsen',
      supportingDescription: 'Kaikille kognitiotieteestä kiinnostuneille. Ei äänioikeutta.',
      price: 'Jäsenmaksu',
      perYear: '/ vuosi',
      customAmount: 'Valitse summa',
      minimumAmount: `Vähintään ${MIN_SUPPORTING_PRICE} €. Isompi summa tukee yhdistyksen toimintaa.`,
      invalidAmount: `Anna kokonaisluku väliltä ${MIN_SUPPORTING_PRICE}–${MAX_SUPPORTING_PRICE} €.`,
      alreadyMember: 'Sinulla on jo voimassa oleva jäsenyys. Hallinnoi sitä Jäsenyyteni-sivulla.',
      renewalNotOpen: 'Jäsenyytesi on vielä pitkään voimassa, joten sitä ei voi vielä uusia.',
      genericError: `Maksun aloittaminen epäonnistui. Yritä uudelleen, tai kirjoita ${CONTACT_EMAIL}.`,
      benefitsList: [
        'Verkostoituminen alan ammattilaisten kanssa',
        'Pääsy jäsentapahtumiin',
        'Jäsenkirje ja ajankohtaiset uutiset',
        'Aktiivinen alumniyhteisö',
      ],
      votingRight: 'Äänioikeus yhdistyksen kokouksissa',
      noVotingRight: 'Ei äänioikeutta',
      joinButton: 'Siirry maksamaan',
      loading: 'Avataan maksua…',
      fromPrice: 'alk.',
      recurring: 'Uusiutuu vuosittain, peru milloin vain',
      oneTime: 'Kertamaksu, voimassa vuoden',
      reassurance: 'Maksu Stripen kautta. Kirjautumista ei tarvita: saat vahvistuksen sähköpostiisi.',
      reassuranceSignedIn: 'Maksu Stripen kautta. Saat vahvistuksen sähköpostiisi.',
    },
    en: {
      fullTitle: 'Full Member',
      fullDescription: 'For cognitive science majors, minors, and graduates. Voting rights at society meetings.',
      supportingTitle: 'Supporting Member',
      supportingDescription: 'For anyone interested in cognitive science. No voting rights.',
      price: 'Membership fee',
      perYear: '/ year',
      customAmount: 'Choose amount',
      minimumAmount: `At least ${MIN_SUPPORTING_PRICE} €. Anything above supports the society's work.`,
      invalidAmount: `Enter a whole number between ${MIN_SUPPORTING_PRICE} and ${MAX_SUPPORTING_PRICE} €.`,
      alreadyMember: 'You already have a valid membership. Manage it on the My Membership page.',
      renewalNotOpen: "Your membership is valid for a while yet, so it can't be renewed already.",
      genericError: `Could not start the payment. Please try again, or write to ${CONTACT_EMAIL}.`,
      benefitsList: [
        'Network with professionals in the field',
        'Access to member events',
        'Newsletter and current news',
        'Active alumni community',
      ],
      votingRight: 'Voting rights at society meetings',
      noVotingRight: 'No voting rights',
      joinButton: 'Continue to payment',
      loading: 'Opening payment…',
      fromPrice: 'from',
      recurring: 'Renews yearly, cancel any time',
      oneTime: 'One-time payment, valid for a year',
      reassurance: "Payment by Stripe. No account needed: we'll email your confirmation.",
      reassuranceSignedIn: "Payment by Stripe. We'll email your confirmation.",
    },
  };

  const text = t[locale as 'fi' | 'en'];

  const handleCheckout = async () => {
    if (membershipType === 'SUPPORTING' && !amountValid) {
      setError(text.invalidAmount);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipType,
          locale,
          amount: membershipType === 'SUPPORTING' ? customAmount : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 409) {
        setError(data.error === 'renewal_not_open' ? text.renewalNotOpen : text.alreadyMember);
        setIsLoading(false);
        return;
      }
      if (!response.ok || !data.url) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError(text.genericError);
      setIsLoading(false);
    }
  };

  const optionCard = (type: MembershipType, children: React.ReactNode) => {
    const disabled = !available(type);
    const selected = membershipType === type;
    const id = type === 'FULL' ? 'full' : 'supporting';
    return (
      <Label htmlFor={id} className={`block ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
        <Card
          className={`relative h-full transition-colors ${
            selected ? 'border-primary ring-1 ring-primary' : disabled ? '' : 'hover:border-primary/50'
          }`}
        >
          {children}
          {options[type]?.note && (
            <p className="mx-6 -mt-2 mb-6 rounded-sm bg-muted px-3 py-2 font-mono text-xs">
              {options[type]?.note}
            </p>
          )}
        </Card>
      </Label>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <RadioGroup
        value={membershipType}
        onValueChange={(value) => {
          setMembershipType(value as MembershipType);
          setError(null);
        }}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2"
      >
        {optionCard(
          'FULL',
          <>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="display-md text-2xl">{text.fullTitle}</CardTitle>
                <RadioGroupItem value="FULL" id="full" disabled={!available('FULL')} />
              </div>
              <CardDescription className="font-serif">{text.fullDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-1 flex items-baseline gap-1.5">
                <span className="display-lg text-4xl tabular-nums">{FULL_PRICE} €</span>
                <span className="font-mono text-xs text-muted-foreground">{text.perYear}</span>
              </div>
              <p className="mb-5 font-mono text-xs text-muted-foreground">{text.recurring}</p>
              <BenefitList items={[...text.benefitsList, text.votingRight]} />
            </CardContent>
          </>
        )}

        {optionCard(
          'SUPPORTING',
          <>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="display-md text-2xl">{text.supportingTitle}</CardTitle>
                <RadioGroupItem value="SUPPORTING" id="supporting" disabled={!available('SUPPORTING')} />
              </div>
              <CardDescription className="font-serif">{text.supportingDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Kept price-shaped so the two cards actually compare — a
                  sentence here breaks the scan. */}
              <div className="mb-1 flex items-baseline gap-1.5">
                <span className="font-mono text-xs text-muted-foreground">{text.fromPrice}</span>
                <span className="display-lg text-4xl tabular-nums">{MIN_SUPPORTING_PRICE} €</span>
              </div>
              <p className="mb-5 font-mono text-xs text-muted-foreground">{text.oneTime}</p>
              <BenefitList items={text.benefitsList} muted={text.noVotingRight} />
            </CardContent>
          </>
        )}
      </RadioGroup>

      {/* Custom Amount Input for Supporting Membership */}
      {membershipType === 'SUPPORTING' && (
        <Card>
          <CardHeader>
            <CardTitle>{text.customAmount}</CardTitle>
            <CardDescription>{text.minimumAmount}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min={MIN_SUPPORTING_PRICE}
                  max={MAX_SUPPORTING_PRICE}
                  step="1"
                  inputMode="numeric"
                  aria-label={text.customAmount}
                  aria-invalid={!amountValid}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="pr-8 text-2xl font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
              {!amountValid && (
                <p className="text-sm text-destructive sm:hidden">{text.invalidAmount}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {SUPPORTING_PRESETS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={customAmount === amount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAmountInput(String(amount))}
                  >
                    {amount} €
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div role="alert" className="rounded-sm bg-destructive/10 p-4 font-serif text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full"
          onClick={handleCheckout}
          disabled={isLoading}
          data-umami-event="membership-checkout"
          data-umami-event-type={membershipType}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
              {text.loading}
            </>
          ) : (
            <>
              {text.joinButton}
              <ArrowRight className="mx-1 h-4 w-4" />
              <span className="tabular-nums">
                {membershipType === 'FULL' ? `${FULL_PRICE} €` : `${amountValid ? customAmount : MIN_SUPPORTING_PRICE} €`}
              </span>
            </>
          )}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="h-3 w-3 shrink-0" />
          {signedIn ? text.reassuranceSignedIn : text.reassurance}
        </p>
      </div>
    </div>
  );
}

function BenefitList({ items, muted }: { items: string[]; muted?: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((benefit) => (
        <li key={benefit} className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
          <span className="font-serif text-sm leading-snug">{benefit}</span>
        </li>
      ))}
      {muted && (
        <li className="flex items-start gap-2 text-muted-foreground">
          <Minus className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="font-serif text-sm leading-snug">{muted}</span>
        </li>
      )}
    </ul>
  );
}
