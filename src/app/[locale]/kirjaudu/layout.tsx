import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'en') {
    return {
      title: 'Sign In – Intelligenzia',
      description: 'Sign in to your Intelligenzia account with a secure magic link.',
    };
  }

  return {
    title: 'Kirjaudu sisään – Intelligenzia',
    description: 'Kirjaudu Intelligenzia-tilillesi turvallisella sähköpostilinkillä.',
  };
}

export default function LoginLayout({ children }: Props) {
  return children;
}
