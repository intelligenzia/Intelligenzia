import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
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
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'fi': '/fi',
        'en': '/en',
      },
    },
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
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
