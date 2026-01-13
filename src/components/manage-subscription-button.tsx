'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Loader2 } from 'lucide-react';

type Props = {
  locale: string;
  membershipType: 'FULL' | 'SUPPORTING';
};

export function ManageSubscriptionButton({ locale, membershipType }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // Only show for FULL members with recurring subscription
  if (membershipType !== 'FULL') {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleManageSubscription}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Settings className="mr-2 h-4 w-4" />
      )}
      {locale === 'fi' ? 'Hallinnoi tilausta' : 'Manage subscription'}
    </Button>
  );
}
