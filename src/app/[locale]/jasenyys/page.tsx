import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';
import { ManageSubscriptionButton } from '@/components/manage-subscription-button';
import { EditNameForm } from '@/components/edit-name-form';
import { AccountPrivacy } from '@/components/account-privacy';
import type { Metadata } from 'next';
import { noIndex } from '@/lib/seo';
import {
  CONTACT_EMAIL,
  RENEWAL_WINDOW_DAYS,
  daysUntilRenewalOpens,
  formatDate,
  localePath,
  loginPath,
  membershipState,
  routeFor,
  typeLabels,
} from '@/lib/membership';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'en') {
    return {
      title: 'My Membership',
      robots: noIndex,
      description: 'Manage your Intelligenzia membership, view your status, and update your information.',
    };
  }

  return {
    title: 'Jäsenyyteni',
    robots: noIndex,
    description: 'Hallinnoi Intelligenzia-jäsenyyttäsi, tarkastele tilaa ja päivitä tietojasi.',
  };
}

type Tone = 'ok' | 'warn' | 'muted';

export default async function MembershipDashboardPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { success } = await searchParams;
  setRequestLocale(locale);
  const fi = locale === 'fi';
  const l = fi ? 'fi' : 'en';

  const session = await auth();

  if (!session?.user) {
    redirect(loginPath(locale, localePath(locale, 'dashboard')));
  }

  const membership = await prisma.membership.findUnique({
    where: { userId: session.user.id },
  });
  const state = membershipState(membership);
  const periods = await prisma.membershipPeriod.findMany({
    where: { userId: session.user.id },
    orderBy: { startsAt: 'desc' },
    select: { id: true, type: true, startsAt: true, endsAt: true },
  });

  // Whether a subscription is set to stop at period end lives only in
  // Stripe. Ask, but never let a Stripe hiccup break the page.
  let endsWithoutRenewal = false;
  if (state.kind === 'active' && state.recurring && membership?.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(membership.stripeSubscriptionId);
      endsWithoutRenewal = sub.cancel_at_period_end || !!sub.cancel_at;
    } catch (err) {
      console.warn('Dashboard: could not read subscription', err);
    }
  }

  const date = (d: Date | null) => (d ? formatDate(d, locale) : null);
  const joinHref = routeFor(locale, 'join');

  // One headline, one sentence, one primary action per state.
  let tone: Tone = 'muted';
  let headline: string;
  let detail: string | null = null;
  let action: React.ReactNode = null;
  let secondary: React.ReactNode = null;

  const manage = (label?: string) =>
    membership && (
      <ManageSubscriptionButton locale={locale} membershipType={membership.type} label={label} />
    );

  switch (state.kind) {
    case 'none':
      headline = state.abandoned
        ? fi ? 'Liittyminen jäi kesken' : 'Your sign-up is unfinished'
        : fi ? 'Et ole vielä jäsen' : "You're not a member yet";
      detail = state.abandoned
        ? fi
          ? 'Maksua ei tehty, joten jäsenyys ei ole vielä voimassa. Voit jatkaa siitä, mihin jäit.'
          : "The payment wasn't completed, so the membership isn't active yet. Pick up where you left off."
        : fi
          ? 'Liittyminen vie minuutin. Varsinainen jäsenyys maksaa 10 € vuodessa.'
          : 'Joining takes a minute. Full membership is 10 € a year.';
      action = (
        <Button asChild>
          <Link href={joinHref}>
            {state.abandoned ? (fi ? 'Jatka liittymistä' : 'Finish joining') : fi ? 'Liity jäseneksi' : 'Become a member'}
          </Link>
        </Button>
      );
      break;

    case 'active':
      tone = 'ok';
      headline = fi
        ? `Olet ${typeLabels[state.type].fi.toLowerCase()}`
        : `You're a ${typeLabels[state.type].en.toLowerCase()}`;
      if (state.recurring) {
        detail = endsWithoutRenewal
          ? fi
            ? `Jäsenyytesi päättyy ${date(state.until)}, eikä se uusiudu.`
            : `Your membership ends on ${date(state.until)} and won't renew.`
          : state.until
            ? fi
              ? `Uusiutuu automaattisesti ${date(state.until)}.`
              : `Renews automatically on ${date(state.until)}.`
            : null;
        action = manage(
          endsWithoutRenewal ? (fi ? 'Jatka jäsenyyttä' : 'Keep my membership') : undefined
        );
      } else {
        const opensIn = daysUntilRenewalOpens(state.until);
        detail = state.until
          ? fi
            ? `Voimassa ${date(state.until)} asti. Kertamaksu, ei uusiudu automaattisesti.`
            : `Valid until ${date(state.until)}. One-time payment, doesn't renew by itself.`
          : null;
        if (opensIn === 0) {
          tone = 'warn';
          action = (
            <Button asChild>
              <Link href={`${joinHref}?type=${state.type}`}>{fi ? 'Uusi jäsenyys' : 'Renew membership'}</Link>
            </Button>
          );
        } else {
          const when = fi
            ? `Voit uusia sen ${RENEWAL_WINDOW_DAYS} päivää ennen päättymistä.`
            : `You can renew it ${RENEWAL_WINDOW_DAYS} days before it ends.`;
          detail = detail ? `${detail} ${when}` : when;
        }
        if (state.type === 'SUPPORTING') {
          secondary = (
            <Link
              href={`${joinHref}?type=FULL`}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {fi ? 'Vaihda varsinaiseksi jäseneksi' : 'Switch to full membership'}
            </Link>
          );
        }
      }
      break;

    case 'payment_issue':
      tone = 'warn';
      headline = fi ? 'Jäsenmaksu epäonnistui' : 'Your membership payment failed';
      detail = fi
        ? 'Stripe yrittää veloitusta uudelleen muutaman päivän ajan. Päivitä maksutapa, niin jäsenyytesi jatkuu katkotta.'
        : 'Stripe will retry the charge for a few days. Update your card to keep your membership without a gap.';
      action = manage(fi ? 'Päivitä maksutapa' : 'Update card');
      break;

    case 'lapsed':
      tone = 'warn';
      headline = fi ? 'Jäsenyytesi on päättynyt' : 'Your membership has ended';
      detail = state.endedAt
        ? fi
          ? `Jäsenyys päättyi ${date(state.endedAt)}. Uusi se, niin olet taas mukana.`
          : `It ended on ${date(state.endedAt)}. Renew to be back in.`
        : null;
      action = (
        <Button asChild>
          <Link href={`${joinHref}?type=${state.type}`}>{fi ? 'Uusi jäsenyys' : 'Renew membership'}</Link>
        </Button>
      );
      break;
  }

  const badge: Record<MembershipStateKind, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    none: { label: fi ? 'Ei jäsenyyttä' : 'Not a member', variant: 'outline' },
    active: { label: fi ? 'Voimassa' : 'Active', variant: 'default' },
    payment_issue: { label: fi ? 'Maksu epäonnistui' : 'Payment failed', variant: 'destructive' },
    lapsed: { label: fi ? 'Päättynyt' : 'Ended', variant: 'secondary' },
  };

  const t = {
    fi: {
      title: 'Jäsenyyteni',
      subtitle: 'Hallinnoi jäsenyyttäsi ja tietojasi',
      myInfo: 'Omat tiedot',
      email: 'Sähköposti',
      name: 'Nimi',
      nameHint: 'Koko nimesi jäsenrekisteriä varten.',
      membership: 'Jäsenyys',
      successTitle: 'Kiitos liittymisestä!',
      successMessage: 'Jäsenyytesi on nyt aktiivinen. Tervetuloa Intelligenziaan!',
      help: 'Kysyttävää jäsenyydestä?',
    },
    en: {
      title: 'My Membership',
      subtitle: 'Manage your membership and information',
      myInfo: 'My Info',
      email: 'Email',
      name: 'Name',
      nameHint: 'Your full name, for the member register.',
      membership: 'Membership',
      successTitle: 'Thank you for joining!',
      successMessage: 'Your membership is now active. Welcome to Intelligenzia!',
      help: 'Questions about your membership?',
    },
  };

  const text = t[l];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{text.title}</h1>
          <p className="text-muted-foreground">{text.subtitle}</p>
        </header>

        {/* Older Stripe sessions still return here with ?success=true */}
        {success && state.kind === 'active' && (
          <Card className="mb-8 border-green-500 bg-green-500/10">
            <CardContent className="flex items-center gap-4 pt-6">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-300">{text.successTitle}</h3>
                <p className="text-green-600 dark:text-green-400">{text.successMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-5">
          {/* Membership Status Card: the one thing people come here for */}
          <Card className={`md:col-span-3 ${tone === 'warn' ? 'border-brand-yellow' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {text.membership}
                </span>
                <Badge variant={badge[state.kind].variant}>{badge[state.kind].label}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                {tone === 'ok' && <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-brand-green" />}
                {tone === 'warn' && <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-brand-yellow" />}
                <div>
                  <p className="display-md text-2xl">{headline}</p>
                  {detail && <p className="mt-2 font-serif text-muted-foreground">{detail}</p>}
                </div>
              </div>
              {(action || secondary) && (
                <div className="flex flex-col items-start gap-3 pt-2">
                  {action}
                  {secondary}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Info Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {text.myInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{text.email}</p>
                <p className="break-all font-medium">{session.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{text.name}</p>
                <EditNameForm currentName={session.user.name || null} locale={locale} />
                <p className="mt-1 text-xs text-muted-foreground">{text.nameHint}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Every paid membership year, imported from Stripe. */}
        {periods.length > 0 && (
          <section className="mt-10">
            <h2 className="display-md text-xl">{fi ? 'Jäsenyyshistoria' : 'Membership history'}</h2>
            <ul className="mt-4 border-t">
              {periods.map((p) => (
                <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b py-3">
                  <span className="font-medium">{typeLabels[p.type][fi ? 'fi' : 'en']}</span>
                  <span className="font-mono text-sm text-muted-foreground tabular-nums">
                    {formatDate(p.startsAt, locale)} – {formatDate(p.endsAt, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <AccountPrivacy
          locale={locale}
          email={session.user.email ?? ''}
          recurring={(state.kind === 'active' && state.recurring) || state.kind === 'payment_issue'}
        />

        {/* Actions */}
        <div className="mt-8 flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            {text.help}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4 hover:text-foreground">
              {CONTACT_EMAIL}
            </a>
          </p>
          <SignOutButton locale={locale} />
        </div>
      </div>
    </div>
  );
}

type MembershipStateKind = ReturnType<typeof membershipState>['kind'];
