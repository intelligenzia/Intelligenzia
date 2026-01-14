'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn('resend', {
        email,
        callbackUrl: locale === 'fi' ? '/fi/jasenyyys' : '/en/membership',
      });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <Image src="/icon.png" alt="Intelligenzia" width={48} height={48} className="dark:invert" />
          </div>
          <CardTitle className="text-2xl">{t('login')}</CardTitle>
          <CardDescription>
            {locale === 'fi'
              ? 'Kirjaudu sisään sähköpostilinkillä'
              : 'Sign in with a magic link sent to your email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="sinun@email.fi"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                locale === 'fi' ? 'Lähetetään...' : 'Sending...'
              ) : (
                t('sendMagicLink')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="inline-flex items-center hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {locale === 'fi' ? 'Takaisin etusivulle' : 'Back to home'}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
