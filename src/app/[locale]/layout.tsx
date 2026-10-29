import type { Metadata } from 'next';
import { Archivo, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { UmamiAnalytics } from '@/components/analytics';
import { auth } from '@/lib/auth';
import './globals.css';

// Display + UI. The width axis is the identity gesture: condensed (~76) for
// display, normal (100) for nav, buttons and labels — one family, two roles.
const archivo = Archivo({
  variable: '--ff-display',
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
});

// Long-form body. Optical sizing and proper Finnish diacritics for the ~130KB
// of essays and glossary definitions that Geist was previously setting.
const sourceSerif = Source_Serif_4({
  variable: '--ff-serif',
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
});

// Utility: English glossary terms, dates, counts, metadata.
const jetbrainsMono = JetBrains_Mono({
  variable: '--ff-mono',
  subsets: ['latin'],
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages();
  const metadata = messages.metadata as { title: string; description: string };

  const siteUrl = 'https://intelligenzia.fi';

  return {
    title: {
      default: metadata.title,
      template: `%s | ${metadata.title}`,
    },
    description: metadata.description,
    keywords: locale === 'fi'
      ? ['kognitiotiede', 'alumnit', 'Helsingin yliopisto', 'aivotutkimus', 'tekoäly', 'kognitiivinen tiede']
      : ['cognitive science', 'alumni', 'University of Helsinki', 'brain research', 'AI', 'cognitive science'],
    authors: [{ name: 'Intelligenzia ry' }],
    creator: 'Intelligenzia ry',
    metadataBase: new URL(siteUrl),
    // No `alternates` here on purpose: an inherited canonical pointed every
    // page without its own at the homepage. Pages set theirs via
    // localizedAlternates().
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `${siteUrl}/${locale}`,
      siteName: 'Intelligenzia',
      locale: locale === 'fi' ? 'fi_FI' : 'en_US',
      alternateLocale: locale === 'fi' ? 'en_US' : 'fi_FI',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'fi' | 'en')) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const session = await auth();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <UmamiAnalytics />
      </head>
      <body
        className={`${archivo.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <div className="relative flex min-h-screen flex-col">
              <Header user={session?.user} />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
