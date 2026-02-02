import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'en') {
    return {
      title: 'Sign In Error – Intelligenzia',
      description: 'There was a problem signing in. Please try again.',
    };
  }

  return {
    title: 'Kirjautumisvirhe – Intelligenzia',
    description: 'Kirjautumisessa tapahtui virhe. Yritä uudelleen.',
  };
}

export default function ErrorLayout({ children }: Props) {
  return children;
}
