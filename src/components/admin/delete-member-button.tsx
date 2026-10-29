'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

/**
 * Erases a member on a request sent to the board (GDPR art. 17). First click
 * arms it, second deletes; cancels any renewing payment in Stripe first.
 */
export function DeleteMemberButton({ userId, label }: { userId: string; label: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/delete-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error === 'subscription_cancel_failed' ? 'Tilausta ei saatu peruttua' : 'Poisto epäonnistui');
    setArmed(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={armed ? 'destructive' : 'ghost'}
        size="sm"
        onClick={run}
        onBlur={() => !busy && setArmed(false)}
        disabled={busy}
        aria-label={armed ? `Vahvista: poista ${label}` : `Poista ${label}`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {armed && <span className="ml-1">Poista pysyvästi</span>}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
