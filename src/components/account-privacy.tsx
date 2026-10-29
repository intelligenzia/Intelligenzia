'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Loader2, Trash2 } from 'lucide-react';

type Props = {
  locale: string;
  email: string;
  /** Has a renewing subscription that deletion will cancel. */
  recurring: boolean;
};

/**
 * The member's GDPR controls: download everything the site stores, or delete
 * the account. Deletion is two steps (open, then type your email) so it
 * can't happen from a stray click.
 */
export function AccountPrivacy({ locale, email, recurring }: Props) {
  const fi = locale === 'fi';
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: typed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error === 'subscription_cancel_failed'
            ? fi
              ? 'Jäsenmaksun uusiutumista ei saatu peruttua, joten tiliä ei poistettu. Yritä hetken päästä uudelleen tai kirjoita hallitus@intelligenzia.fi.'
              : "We couldn't stop your renewing payment, so the account wasn't deleted. Try again shortly or write to hallitus@intelligenzia.fi."
            : fi
              ? 'Poistaminen epäonnistui. Yritä uudelleen tai kirjoita hallitus@intelligenzia.fi.'
              : 'Deletion failed. Try again or write to hallitus@intelligenzia.fi.'
        );
        setBusy(false);
        return;
      }
      // The sessions are already gone; this only clears the cookie.
      await signOut({ redirect: false });
      setDeleted(true);
    } catch {
      setError(fi ? 'Yhteysvirhe. Yritä uudelleen.' : 'Connection error. Try again.');
      setBusy(false);
    }
  };

  if (deleted) {
    return (
      <section role="status" className="mt-12 border-t pt-8">
        <h2 className="display-md text-xl">{fi ? 'Tilisi on poistettu' : 'Your account has been deleted'}</h2>
        <p className="mt-2 max-w-[60ch] font-serif text-muted-foreground">
          {fi
            ? 'Tietosi on poistettu sivustolta ja jäsenyytesi on päättynyt. Kiitos ajastasi Intelligenziassa.'
            : 'Your data has been removed from the site and your membership has ended. Thank you for your time with Intelligenzia.'}
        </p>
        <Button asChild className="mt-5">
          <a href={fi ? '/' : '/en'}>{fi ? 'Etusivulle' : 'Go to the homepage'}</a>
        </Button>
      </section>
    );
  }

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="display-md text-xl">{fi ? 'Omat tietosi' : 'Your data'}</h2>
      <p className="mt-2 max-w-[60ch] font-serif text-muted-foreground text-pretty">
        {fi
          ? 'Voit ladata kaikki sivustolle tallennetut tietosi tai poistaa tilisi. Maksutiedot säilyvät Stripessä ja yhdistyksen kirjanpidossa kirjanpitolain vaatimat 6 vuotta.'
          : 'You can download everything the site stores about you or delete your account. Payment records stay with Stripe and in the society’s bookkeeping for the 6 years the Accounting Act requires.'}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <a href="/api/account/export" download>
            <Download className="mr-2 h-4 w-4" />
            {fi ? 'Lataa tietosi' : 'Download your data'}
          </a>
        </Button>
        {!open && (
          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {fi ? 'Poista tili' : 'Delete account'}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-6 max-w-xl space-y-4 rounded-sm border border-destructive/40 p-5">
          <p className="font-medium">{fi ? 'Tilin poistaminen' : 'Deleting your account'}</p>
          <ul className="list-disc space-y-1 pl-5 font-serif text-[15px] text-muted-foreground">
            <li>
              {fi
                ? 'Jäsenyytesi päättyy heti ja eroat yhdistyksestä. Maksettuja jäsenmaksuja ei palauteta.'
                : 'Your membership ends now and you resign from the society. Fees already paid are not refunded.'}
            </li>
            {recurring && (
              <li>
                {fi ? 'Vuosittain uusiutuva jäsenmaksu perutaan.' : 'Your yearly renewing payment is cancelled.'}
              </li>
            )}
            <li>
              {fi
                ? 'Nimesi, sähköpostisi ja jäsenyyshistoriasi poistetaan sivustolta. Poistoa ei voi perua.'
                : 'Your name, email and membership history are removed from the site. This cannot be undone.'}
            </li>
          </ul>
          <div className="space-y-2">
            <Label htmlFor="confirm-email">
              {fi ? 'Vahvista kirjoittamalla sähköpostiosoitteesi' : 'Confirm by typing your email address'}
            </Label>
            <Input
              id="confirm-email"
              type="email"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={email}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="destructive" onClick={remove} disabled={!matches || busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />}
              {fi ? 'Poista tili pysyvästi' : 'Delete account permanently'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setTyped('');
                setError(null);
              }}
              disabled={busy}
            >
              {fi ? 'Peruuta' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
