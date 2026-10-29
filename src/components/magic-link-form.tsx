'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail } from 'lucide-react';
import { localePath } from '@/lib/membership';

/** sessionStorage key the verify page reads to say where the link went. */
export const SENT_TO_KEY = 'intelligenzia:magic-link-email';

type Props = {
  locale: string;
  callbackUrl: string;
  defaultEmail?: string;
  submitLabel?: string;
};

export function MagicLinkForm({ locale, callbackUrl, defaultEmail = '', submitLabel }: Props) {
  const router = useRouter();
  const fi = locale !== 'en';
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // redirect: false so we can land on the verify page in the visitor's
      // own language; Auth.js only knows the Finnish one.
      const res = await signIn('resend', { email, callbackUrl, redirect: false });
      if (!res?.ok || res.error) throw new Error(res?.error ?? 'failed');
      try {
        sessionStorage.setItem(SENT_TO_KEY, email);
      } catch {
        // Private mode: the verify page just won't name the address.
      }
      router.push(localePath(locale, 'verify'));
    } catch (err) {
      console.error('Sign in error:', err);
      setError(
        fi
          ? 'Linkin lähettäminen epäonnistui. Tarkista osoite ja yritä uudelleen.'
          : "We couldn't send the link. Check the address and try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{fi ? 'Sähköposti' : 'Email'}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={fi ? 'nimi@esimerkki.fi' : 'name@example.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            aria-invalid={!!error}
            required
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {fi ? 'Lähetetään…' : 'Sending…'}
          </>
        ) : (
          (submitLabel ?? (fi ? 'Lähetä kirjautumislinkki' : 'Send sign-in link'))
        )}
      </Button>
    </form>
  );
}

/** Only same-site relative paths; anything else falls back to the dashboard. */
export function safeCallback(value: string | null | undefined, locale: string): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return localePath(locale, 'dashboard');
}
