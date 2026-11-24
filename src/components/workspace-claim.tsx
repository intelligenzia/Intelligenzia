'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Loader2, RotateCcw } from 'lucide-react';
import { CONTACT_EMAIL } from '@/lib/membership';
import { checkLocalPart, localPartMessages, normalizeLocalPart, LOCAL_PART_MAX } from '@/lib/workspace-plans';

type Remote = { local: string; ok: boolean; reason?: keyof typeof localPartMessages };

/** Pick the part before the @, see live whether it's free, and create it. */
export function WorkspaceClaim({ locale, domain, suggestion }: { locale: string; domain: string; suggestion: string }) {
  const fi = locale === 'fi';
  const l = fi ? 'fi' : 'en';
  const router = useRouter();
  const [value, setValue] = useState(suggestion);
  // The server's answer, remembered with the input it was for.
  const [remote, setRemote] = useState<Remote | null>(null);
  const [confirmFor, setConfirmFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const local = normalizeLocalPart(value);
  const problem = local ? checkLocalPart(local) : null;
  const confirming = confirmFor === local;

  // Rules are checked in the browser; the server only answers for the rest.
  useEffect(() => {
    if (!local || problem) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/workspace/check?local=${encodeURIComponent(local)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.ok) setRemote({ local, ok: data.ok, reason: data.reason });
      } catch {
        // Aborted by the next keystroke, or offline: the status stays "checking".
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [local, problem]);

  const status: { kind: 'idle' | 'checking' | 'ok' } | { kind: 'problem'; message: string } = !local
    ? { kind: 'idle' }
    : problem
      ? { kind: 'problem', message: localPartMessages[problem][l] }
      : remote?.local !== local
        ? { kind: 'checking' }
        : remote.ok
          ? { kind: 'ok' }
          : { kind: 'problem', message: localPartMessages[remote.reason ?? 'taken'][l] };

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/workspace/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ local, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.status === 'active' || data.status === 'requested' || data.status === 'already_has') {
        router.refresh();
        return;
      }
      if (data.status === 'invalid') {
        setRemote({ local, ok: false, reason: data.reason });
        setConfirmFor(null);
      } else {
        setError(
          fi
            ? `Osoitteen luominen epäonnistui. Yritä uudelleen tai kirjoita ${CONTACT_EMAIL}.`
            : `Couldn't create the address. Try again or write to ${CONTACT_EMAIL}.`
        );
      }
    } catch {
      setError(fi ? 'Yhteysvirhe. Yritä uudelleen.' : 'Connection error. Try again.');
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="workspace-local">{fi ? 'Valitse osoitteesi' : 'Choose your address'}</Label>
      <div className="flex max-w-md items-center rounded-md border focus-within:ring-2 focus-within:ring-ring">
        <Input
          id="workspace-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={LOCAL_PART_MAX + 5}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="border-0 font-mono shadow-none focus-visible:ring-0"
          aria-describedby="workspace-status"
        />
        <span className="shrink-0 pr-3 font-mono text-sm text-muted-foreground">@{domain}</span>
      </div>
      <p id="workspace-status" className="min-h-5 text-sm" aria-live="polite">
        {status.kind === 'checking' && (
          <span className="text-muted-foreground">{fi ? 'Tarkistetaan…' : 'Checking…'}</span>
        )}
        {status.kind === 'ok' && (
          <span className="inline-flex items-center gap-1 text-brand-green">
            <Check className="h-4 w-4" />
            {fi ? `${local}@${domain} on vapaana.` : `${local}@${domain} is available.`}
          </span>
        )}
        {status.kind === 'problem' && <span className="text-destructive">{status.message}</span>}
      </p>

      {!confirming ? (
        <Button onClick={() => setConfirmFor(local)} disabled={status.kind !== 'ok'}>
          {fi ? 'Luo osoite' : 'Create address'}
        </Button>
      ) : (
        <div className="space-y-3 rounded-md border p-4">
          <p className="text-sm">
            {fi
              ? `Luodaanko ${local}@${domain}? Osoitetta ei voi myöhemmin vaihtaa itse.`
              : `Create ${local}@${domain}? You can't change the address yourself later.`}
          </p>
          <div className="flex gap-2">
            <Button onClick={create} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {fi ? 'Kyllä, luo' : 'Yes, create it'}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmFor(null)} disabled={busy}>
              {fi ? 'Peruuta' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Brings back a suspended address after the membership is renewed. */
export function ReactivateAddress({ locale }: { locale: string }) {
  const fi = locale === 'fi';
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const go = async () => {
    setBusy(true);
    setFailed(false);
    const res = await fetch('/api/workspace/reactivate', { method: 'POST' }).catch(() => null);
    if (res?.ok) router.refresh();
    else setFailed(true);
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      <Button onClick={go} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
        {fi ? 'Ota osoite taas käyttöön' : 'Turn the address back on'}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {fi
            ? `Osoitetta ei saatu käyttöön. Kirjoita ${CONTACT_EMAIL}.`
            : `Couldn't turn the address back on. Write to ${CONTACT_EMAIL}.`}
        </p>
      )}
    </div>
  );
}
