import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { MembershipCheckout } from '@/components/membership-checkout';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cancelled?: string }>;
};

export default async function JoinMembershipPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { cancelled } = await searchParams;
  setRequestLocale(locale);

  const session = await auth();
  const isLoggedIn = !!session?.user;

  const t = {
    fi: {
      title: 'Liity jäseneksi',
      subtitle: 'Liity Intelligenzian jäseneksi ja tue kognitiotieteen alumniyhteisöä.',
      cancelled: 'Maksu peruutettiin. Voit yrittää uudelleen.',
    },
    en: {
      title: 'Become a Member',
      subtitle: 'Join Intelligenzia and support the cognitive science alumni community.',
      cancelled: 'Payment was cancelled. You can try again.',
    },
  };

  const text = t[locale as 'fi' | 'en'];

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{text.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{text.subtitle}</p>
      </header>

      {cancelled && (
        <div className="mx-auto mb-8 max-w-md rounded-md bg-yellow-500/10 p-4 text-center text-yellow-700 dark:text-yellow-300">
          {text.cancelled}
        </div>
      )}

      <MembershipCheckout locale={locale} isLoggedIn={isLoggedIn} />
    </div>
  );
}
