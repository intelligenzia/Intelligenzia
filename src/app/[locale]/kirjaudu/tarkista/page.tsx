import { useLocale, useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Brain } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function VerifyRequestPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {locale === 'fi' ? 'Tarkista sähköpostisi' : 'Check your email'}
          </CardTitle>
          <CardDescription>
            {locale === 'fi'
              ? 'Lähetimme kirjautumislinkin sähköpostiisi. Klikkaa linkkiä kirjautuaksesi sisään.'
              : 'We sent a sign-in link to your email. Click the link to sign in.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {locale === 'fi'
              ? 'Jos et saa viestiä muutaman minuutin kuluessa, tarkista roskapostikansio.'
              : "If you don't receive the email within a few minutes, check your spam folder."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
