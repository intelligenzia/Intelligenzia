'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import type { BackfillResult } from '@/lib/membership-backfill';

/** Rebuilds memberships from Stripe. Sends no emails. */
export function StripeSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sync = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/sync-stripe', { method: 'POST' });
      const data = (await res.json()) as BackfillResult & { error?: string };
      if (!res.ok) throw new Error(data.error);
      setMessage(
        `${data.members} jäsentä (${data.active} aktiivista) · ${data.subscriptions} tilausta, ${data.oneOffPayments} kertamaksua` +
          (data.errors.length ? ` · ${data.errors.length} virhettä, katso lokit` : '')
      );
      if (data.errors.length) console.error(data.errors);
      router.refresh();
    } catch {
      setMessage('Synkronointi epäonnistui.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
      <Button variant="outline" size="sm" onClick={sync} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
        Synkronoi Stripestä
      </Button>
    </div>
  );
}
