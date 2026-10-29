import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { AlternatePathProvider } from '@/components/alternate-path-context';
import { CheckCircle, Clock, Mail } from 'lucide-react';
import { noIndex } from '@/lib/seo';
import { fulfillCheckoutSession, type FulfillResult } from '@/lib/membership-sync';
import {
  CONTACT_EMAIL,
  formatDate,
  formatEuros,
  localePath,
  loginPath,
  routeFor,
  typeLabels,
} from '@/lib/membership';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === 'en' ? 'Thank you' : 'Kiitos', robots: noIndex };
}

export default async function ThanksPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;
  setRequestLocale(locale);
  const fi = locale === 'fi';

  if (!sessionId?.startsWith('cs_')) redirect(localePath(locale, 'join'));

  let result: FulfillResult;
  try {
    // Same idempotent step the webhook runs. Doing it here too means the
    // member sees the outcome even if the webhook is slow or misconfigured.
    result = await fulfillCheckoutSession(sessionId);
  } catch (err) {
    // Unknown session id: nothing to thank anyone for.
    if ((err as { type?: string }).type === 'StripeInvalidRequestError') {
      redirect(localePath(locale, 'join'));
    }
    // Anything else (database, Stripe outage) is ours to fix; the payment
    // went through and the webhook will retry, so reassure rather than alarm.
    console.error('Thanks page: fulfillment failed', err);
    result = { status: 'processing', email: '', locale };
  }
  if (result.status === 'not_paid') redirect(localePath(locale, 'join'));

  const session = await auth();
  const dashboardHref = session?.user
    ? localePath(locale, 'dashboard')
    : loginPath(locale, localePath(locale, 'dashboard'), result.email || undefined);
  const query = `?session_id=${encodeURIComponent(sessionId)}`;

  return (
    <AlternatePathProvider
      paths={{ fi: `${routeFor('fi', 'thanks')}${query}`, en: `${routeFor('en', 'thanks')}${query}` }}
    >
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-xl">
          {result.status === 'active' ? (
            <Confirmed result={result} locale={locale} />
          ) : (
            <Pending status={result.status} email={result.email} locale={locale} />
          )}

          <section className="mt-12 border-t pt-8">
            <h2 className="display-md text-xl">{fi ? 'Mitä seuraavaksi' : "What's next"}</h2>
            <ol className="mt-4 space-y-4 font-serif">
              <li className="flex gap-3">
                <Mail className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  {fi
                    ? 'Saat vahvistuksen ja kuitin sähköpostiisi. Säilytä ne, jos tarvitset todistuksen jäsenyydestä.'
                    : 'A confirmation and a receipt are on their way to your inbox. Keep them if you need proof of membership.'}
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  {fi
                    ? 'Jäsenyyteni-sivulla näet voimassaolon ja voit päivittää tietojasi. Kirjaudu samalla sähköpostiosoitteella, salasanaa ei tarvita.'
                    : 'On My Membership you can see your validity and update your details. Sign in with the same email, no password needed.'}
                </span>
              </li>
            </ol>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href={dashboardHref}>{fi ? 'Jäsenyyteni' : 'My membership'}</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={fi ? '/blogi' : '/blog'}>{fi ? 'Lue ajankohtaisia' : 'Read the latest'}</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </AlternatePathProvider>
  );
}

function Confirmed({
  result,
  locale,
}: {
  result: Extract<FulfillResult, { status: 'active' }>;
  locale: string;
}) {
  const fi = locale === 'fi';
  const firstName = result.name?.split(' ')[0];
  const heading = {
    welcome: fi
      ? `Tervetuloa jäseneksi${firstName ? `, ${firstName}` : ''}!`
      : `Welcome aboard${firstName ? `, ${firstName}` : ''}!`,
    renewal: fi ? 'Kiitos, jäsenyytesi on voimassa' : 'Thank you, your membership is renewed',
    upgrade: fi ? 'Olet nyt varsinainen jäsen' : "You're now a full member",
  }[result.kind];

  const rows: [string, string][] = [
    [fi ? 'Jäsenyys' : 'Membership', typeLabels[result.type][fi ? 'fi' : 'en']],
  ];
  if (result.until) {
    rows.push(
      result.recurring
        ? [fi ? 'Uusiutuu' : 'Renews', formatDate(result.until, locale)]
        : [fi ? 'Voimassa' : 'Valid until', formatDate(result.until, locale)]
    );
  }
  if (result.firstChargeOn) {
    rows.push([fi ? 'Ensimmäinen veloitus' : 'First charge', formatDate(result.firstChargeOn, locale)]);
  } else if (result.amountEuros) {
    rows.push([fi ? 'Maksettu' : 'Paid', formatEuros(result.amountEuros, locale)]);
  }
  rows.push([fi ? 'Sähköposti' : 'Email', result.email]);

  return (
    <div>
      <CheckCircle className="h-12 w-12 text-brand-green" />
      <h1 className="display-lg mt-6 text-4xl">{heading}</h1>
      <p className="mt-4 font-serif text-lg text-muted-foreground">
        {fi
          ? 'Maksusi on vastaanotettu. Kiitos, että tuet kognitiotieteen yhteisöä.'
          : 'Your payment has been received. Thank you for supporting the cognitive science community.'}
      </p>
      <dl className="mt-8 divide-y rounded-sm border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Pending({
  status,
  email,
  locale,
}: {
  status: 'processing' | 'duplicate';
  email: string;
  locale: string;
}) {
  const fi = locale === 'fi';
  const body =
    status === 'duplicate'
      ? fi
        ? `Maksusi on vastaanotettu, mutta osoitteella ${email} on jo voimassa oleva jäsenyys. Kirjoita ${CONTACT_EMAIL}, niin selvitämme tuplamaksun.`
        : `Your payment was received, but ${email} already has an active membership. Write to ${CONTACT_EMAIL} and we'll sort out the double payment.`
      : fi
        ? `Maksusi on vielä käsittelyssä. Lähetämme vahvistuksen${email ? ` osoitteeseen ${email}` : ''} heti, kun se on valmis. Sinun ei tarvitse tehdä mitään.`
        : `Your payment is still being processed. We'll email a confirmation${email ? ` to ${email}` : ''} as soon as it clears. You don't need to do anything.`;

  return (
    <div>
      <Clock className="h-12 w-12 text-muted-foreground" />
      <h1 className="display-lg mt-6 text-4xl">
        {status === 'duplicate'
          ? fi ? 'Olet jo jäsen' : "You're already a member"
          : fi ? 'Kiitos! Melkein valmista' : 'Thank you! Almost done'}
      </h1>
      <p className="mt-4 font-serif text-lg text-muted-foreground">{body}</p>
    </div>
  );
}
