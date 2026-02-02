import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'en') {
    return {
      title: 'Check Your Email – Intelligenzia',
      description: 'We sent you a sign-in link. Check your email to continue.',
    };
  }

  return {
    title: 'Tarkista sähköpostisi – Intelligenzia',
    description: 'Lähetimme sinulle kirjautumislinkin. Tarkista sähköpostisi jatkaaksesi.',
  };
}

export default function VerifyLayout({ children }: Props) {
  return children;
}
