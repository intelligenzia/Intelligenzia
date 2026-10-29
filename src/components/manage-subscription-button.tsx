'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Loader2 } from 'lucide-react';

type Props = {
  locale: string;
  membershipType: 'FULL' | 'SUPPORTING';
  label?: string;
};

export function ManageSubscriptionButton({ locale, membershipType, label }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    setFailed(false);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Portal error:', error);
      setFailed(true);
      setIsLoading(false);
    }
  };

  // Only show for FULL members with recurring subscription
  if (membershipType !== 'FULL') {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button variant={label ? 'default' : 'outline'} onClick={handleManageSubscription} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Settings className="mr-2 h-4 w-4" />
        )}
        {label ?? (locale === 'fi' ? 'Maksutapa, kuitit ja uusiutuminen' : 'Card, receipts and renewal')}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {locale === 'fi'
            ? 'Tilauksen hallintaa ei voitu avata. Yritä uudelleen tai ota yhteyttä hallitus@intelligenzia.fi.'
            : 'Could not open subscription management. Try again or contact hallitus@intelligenzia.fi.'}
        </p>
      )}
    </div>
  );
}
