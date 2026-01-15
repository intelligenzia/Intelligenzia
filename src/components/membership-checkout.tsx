'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, Heart, Check, Loader2 } from 'lucide-react';

type Props = {
  locale: string;
  isLoggedIn: boolean;
};

const FULL_PRICE = 10; // €10/year
const MIN_SUPPORTING_PRICE = 10; // Minimum €10

export function MembershipCheckout({ locale, isLoggedIn }: Props) {
  const router = useRouter();
  const [membershipType, setMembershipType] = useState<'FULL' | 'SUPPORTING'>('FULL');
  const [customAmount, setCustomAmount] = useState<number>(MIN_SUPPORTING_PRICE);
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
      minimumAmount: `Vähintään ${MIN_SUPPORTING_PRICE} €`,
      benefits: 'Sisältää:',
      benefitsList: [
        'Verkostoituminen alan ammattilaisten kanssa',
        'Pääsy jäsentapahtumiin',
        'Jäsenkirje ja ajankohtaiset uutiset',
        'Aktiivinen alumniyhteisö',
      ],
      joinButton: 'Siirry maksamaan',
      loginFirst: 'Kirjaudu ensin',
      loginDescription: 'Sinun täytyy kirjautua sisään ennen jäsenyyden ostamista.',
      loginButton: 'Kirjaudu sisään',
      payWhatYouWant: 'Valitse itse summasi',
      recurring: 'Uusiutuu vuosittain',
      oneTime: 'Kertamaksu (1 vuosi)',
    },
    en: {
      fullTitle: 'Full Member',
      fullDescription: 'For cognitive science majors, minors, and graduates. Voting rights at society meetings.',
      supportingTitle: 'Supporting Member',
      supportingDescription: 'For anyone interested in cognitive science. No voting rights.',
      price: 'Membership fee',
      perYear: '/ year',
      customAmount: 'Choose amount',
      minimumAmount: `Minimum ${MIN_SUPPORTING_PRICE} €`,
      benefits: 'Includes:',
      benefitsList: [
        'Network with professionals in the field',
        'Access to member events',
        'Newsletter and current news',
        'Active alumni community',
      ],
      joinButton: 'Proceed to payment',
      loginFirst: 'Log in first',
      loginDescription: 'You need to log in before purchasing a membership.',
      loginButton: 'Log in',
      payWhatYouWant: 'Pay what you want',
      recurring: 'Renews annually',
      oneTime: 'One-time payment (1 year)',
    },
  };

  const text = t[locale as 'fi' | 'en'];

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      router.push(locale === 'fi' ? '/fi/kirjaudu' : '/en/login');
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
          customAmount: membershipType === 'SUPPORTING' ? customAmount * 100 : undefined, // Convert to cents
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{text.loginFirst}</CardTitle>
          <CardDescription>{text.loginDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => router.push(locale === 'fi' ? '/fi/kirjaudu' : '/en/login')}
          >
            {text.loginButton}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <RadioGroup
        value={membershipType}
        onValueChange={(value) => setMembershipType(value as 'FULL' | 'SUPPORTING')}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2"
      >
        {/* Full Membership Card */}
        <Label htmlFor="full" className="block cursor-pointer">
          <Card className={`relative h-full transition-all ${membershipType === 'FULL' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 text-primary" />
                <RadioGroupItem value="FULL" id="full" />
              </div>
              <CardTitle className="mt-4">{text.fullTitle}</CardTitle>
              <CardDescription>{text.fullDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">{FULL_PRICE} €</span>
                <span className="text-muted-foreground">{text.perYear}</span>
              </div>
              <p className="text-xs text-muted-foreground">{text.recurring}</p>
            </CardContent>
          </Card>
        </Label>

        {/* Supporting Membership Card */}
        <Label htmlFor="supporting" className="block cursor-pointer">
          <Card className={`relative h-full transition-all ${membershipType === 'SUPPORTING' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Heart className="h-8 w-8 text-primary" />
                <RadioGroupItem value="SUPPORTING" id="supporting" />
              </div>
              <CardTitle className="mt-4">{text.supportingTitle}</CardTitle>
              <CardDescription>{text.supportingDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">{text.payWhatYouWant}</span>
              </div>
              <p className="text-xs text-muted-foreground">{text.oneTime}</p>
            </CardContent>
          </Card>
        </Label>
      </RadioGroup>

      {/* Custom Amount Input for Supporting Membership */}
      {membershipType === 'SUPPORTING' && (
        <Card>
          <CardHeader>
            <CardTitle>{text.customAmount}</CardTitle>
            <CardDescription>{text.minimumAmount}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min={MIN_SUPPORTING_PRICE}
                  step="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Math.max(MIN_SUPPORTING_PRICE, parseInt(e.target.value) || MIN_SUPPORTING_PRICE))}
                  className="pr-8 text-2xl font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
              <div className="flex gap-2">
                {[10, 20, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant={customAmount === amount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCustomAmount(amount)}
                  >
                    {amount} €
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>{text.benefits}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {text.benefitsList.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Checkout Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleCheckout}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {locale === 'fi' ? 'Ladataan...' : 'Loading...'}
          </>
        ) : (
          <>
            {text.joinButton} →{' '}
            {membershipType === 'FULL' ? `${FULL_PRICE} €` : `${customAmount} €`}
          </>
        )}
      </Button>
    </div>
  );
}
