import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function AuthErrorPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);

  const errorMessages: Record<string, { fi: string; en: string }> = {
    Configuration: {
      fi: 'Palvelimen asetuksissa on ongelma.',
      en: 'There is a problem with the server configuration.',
    },
    AccessDenied: {
      fi: 'Sinulla ei ole oikeutta kirjautua.',
      en: 'You do not have permission to sign in.',
    },
    Verification: {
      fi: 'Kirjautumislinkki on vanhentunut tai sitä on jo käytetty.',
      en: 'The sign-in link has expired or has already been used.',
    },
    Default: {
      fi: 'Kirjautumisessa tapahtui virhe.',
      en: 'An error occurred while signing in.',
    },
  };

  const errorMessage = errorMessages[error || 'Default'] || errorMessages.Default;
  const loginPath = locale === 'fi' ? '/kirjaudu' : '/login';

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {locale === 'fi' ? 'Kirjautumisvirhe' : 'Sign-in Error'}
          </CardTitle>
          <CardDescription>{errorMessage[locale as 'fi' | 'en']}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href={loginPath}>
              {locale === 'fi' ? 'Yritä uudelleen' : 'Try again'}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
