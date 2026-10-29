'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import type { BackfillResult } from '@/lib/membership-backfill';

/**
 * Rebuilds memberships and their year-by-year history from Stripe. Sends no
 * emails. "Esikatsele" reads Stripe without writing, so the admin can check
 * what counts as a membership payment before importing.
 */
export function StripeSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState<'preview' | 'sync' | null>(null);
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [failed, setFailed] = useState(false);

  const run = async (dryRun: boolean) => {
    setLoading(dryRun ? 'preview' : 'sync');
    setFailed(false);
    try {
      const res = await fetch(`/api/admin/sync-stripe${dryRun ? '?dryRun=1' : ''}`, { method: 'POST' });
      const data = (await res.json()) as BackfillResult & { error?: string };
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      if (data.errors.length) console.error(data.errors);
      if (!dryRun) router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setLoading(null);
    }
  };

  const years = result ? Object.entries(result.periodsByYear).sort(([a], [b]) => Number(b) - Number(a)) : [];

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => run(true)} disabled={!!loading}>
          {loading === 'preview' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Esikatsele
        </Button>
        <Button variant="outline" size="sm" onClick={() => run(false)} disabled={!!loading}>
          {loading === 'sync' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Synkronoi Stripestä
        </Button>
      </div>

      {failed && <p className="text-sm text-destructive">Synkronointi epäonnistui. Katso lokit.</p>}

      {result && (
        <div className="w-full max-w-xl space-y-3 rounded-sm border bg-card p-4 text-sm">
          <p>
            {result.dryRun ? 'Esikatselu, mitään ei tallennettu: ' : 'Tallennettu: '}
            {result.members} jäsentä ({result.active} aktiivista), {result.periods} maksettua
            jäsenvuotta. Lähteet: {result.subscriptions} tilausta, {result.oneOffPayments} kertamaksua,{' '}
            {result.legacyCharges} vanhaa maksua.
            {result.errors.length > 0 && ` ${result.errors.length} virhettä, katso lokit.`}
          </p>
          {years.length > 0 && (
            <p className="font-mono text-xs text-muted-foreground">
              {years.map(([y, n]) => `${y}: ${n}`).join('   ')}
            </p>
          )}
          {result.unmatched.length > 0 && (
            <details>
              <summary className="cursor-pointer text-muted-foreground">
                {result.unmatched.reduce((s, u) => s + u.count, 0)} maksua ei tunnistettu jäsenmaksuksi
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                {result.unmatched.slice(0, 40).map((u) => (
                  <li key={`${u.year}-${u.label}-${u.amount}`}>
                    {u.year} · {u.label} · {u.amount} € · {u.count}×
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
