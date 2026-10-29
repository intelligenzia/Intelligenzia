import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { MembershipCheckout, type CheckoutOptions } from '@/components/membership-checkout';
import type { Metadata } from 'next';
import { localizedAlternates } from '@/lib/seo';
import {
  formatDate,
  localePath,
  loginPath,
  membershipState,
  planCheckout,
  routeFor,
  type MembershipType,
} from '@/lib/membership';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cancelled?: string; type?: string; amount?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'en') {
    return {
      title: 'Become a Member',
      description:
        'Join Intelligenzia and connect with the cognitive science alumni community. Support research, networking, and events in cognitive science.',
      alternates: localizedAlternates(locale, { fi: '/jaseneksi', en: '/join' }),
    };
  }

  return {
    title: 'Liity jäseneksi',
    description:
      'Liity Intelligenzian jäseneksi ja verkostoidu kognitiotieteen alumnien kanssa. Tue tutkimusta, verkostoitumista ja tapahtumia.',
    alternates: localizedAlternates(locale, { fi: '/jaseneksi', en: '/join' }),
  };
}

export default async function JoinMembershipPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { cancelled, type, amount } = await searchParams;
  setRequestLocale(locale);
  const fi = locale === 'fi';

  const session = await auth();
  const membership = session?.user?.id
    ? await prisma.membership.findUnique({ where: { userId: session.user.id } })
    : null;
  const state = membershipState(membership);

  const t = {
    fi: {
      title: 'Liity jäseneksi',
      subtitle: 'Liity Intelligenzian jäseneksi ja tue kognitiotieteen alumniyhteisöä.',
      steps: ['Valitse jäsenyys', 'Maksa', 'Vahvistus sähköpostiin'],
      cancelled: 'Maksu jäi kesken, eikä sinulta veloitettu mitään. Valintasi on tallessa alla.',
      alreadyTitle: 'Olet jo jäsen',
      dashboard: 'Jäsenyyteni',
      signInPrompt: 'Oletko jo jäsen?',
      signInLink: 'Kirjaudu uusiaksesi jäsenyytesi',
    },
    en: {
      title: 'Become a Member',
      subtitle: 'Join Intelligenzia and support the cognitive science alumni community.',
      steps: ['Choose a membership', 'Pay', 'Confirmation by email'],
      cancelled: "The payment wasn't completed and nothing was charged. Your choice is saved below.",
      alreadyTitle: "You're already a member",
      dashboard: 'My membership',
      signInPrompt: 'Already a member?',
      signInLink: 'Sign in to renew your membership',
    },
  };
  const text = t[fi ? 'fi' : 'en'];

  // A live subscription renews by itself: there is nothing to buy here.
  if ((state.kind === 'active' && state.recurring) || state.kind === 'payment_issue') {
    const body =
      state.kind === 'payment_issue'
        ? fi
          ? 'Viimeisin jäsenmaksusi epäonnistui. Päivitä maksutapa Jäsenyyteni-sivulla, niin jäsenyytesi jatkuu.'
          : 'Your last membership payment failed. Update your card on the My Membership page to keep it going.'
        : state.until
          ? fi
            ? `Varsinainen jäsenyytesi uusiutuu automaattisesti ${formatDate(state.until, locale)}.`
            : `Your full membership renews automatically on ${formatDate(state.until, locale)}.`
          : fi
            ? 'Varsinainen jäsenyytesi uusiutuu automaattisesti.'
            : 'Your full membership renews automatically.';
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="display-lg text-4xl">{text.alreadyTitle}</h1>
          <p className="mt-4 font-serif text-lg text-muted-foreground">{body}</p>
          <Button asChild size="lg" className="mt-8">
            <Link href={routeFor(locale, 'dashboard')}>{text.dashboard}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const options: CheckoutOptions = {};
  if (session?.user) {
    for (const option of ['FULL', 'SUPPORTING'] as MembershipType[]) {
      const plan = planCheckout(state, option);
      if (!plan.ok) {
        options[option] = {
          disabled: true,
          note:
            plan.reason === 'renewal_not_open'
              ? fi
                ? `Voit uusia ${plan.opensInDays} päivän päästä.`
                : `Renewal opens in ${plan.opensInDays} days.`
              : undefined,
        };
      } else if (plan.trialEnd) {
        options[option] = {
          note: fi
            ? `Alkaa heti, ensimmäinen veloitus ${formatDate(plan.trialEnd, locale)}.`
            : `Starts now, first charge on ${formatDate(plan.trialEnd, locale)}.`,
        };
      } else if (plan.periodStart) {
        const end = new Date(plan.periodStart);
        end.setFullYear(end.getFullYear() + 1);
        options[option] = {
          note: fi
            ? `Jatkaa jäsenyyttäsi ${formatDate(end, locale)} asti.`
            : `Extends your membership to ${formatDate(end, locale)}.`,
        };
      }
    }
  }

  const context =
    state.kind === 'active' && state.until
      ? fi
        ? `Olet kannatusjäsen ${formatDate(state.until, locale)} asti.`
        : `You're a supporting member until ${formatDate(state.until, locale)}.`
      : state.kind === 'lapsed' && state.endedAt
        ? fi
          ? `Jäsenyytesi päättyi ${formatDate(state.endedAt, locale)}. Tervetuloa takaisin!`
          : `Your membership ended on ${formatDate(state.endedAt, locale)}. Welcome back!`
        : null;

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{text.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{text.subtitle}</p>
        <ol className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
          {text.steps.map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden="true">→</span>}
              <span>
                {i + 1}. {step}
              </span>
            </li>
          ))}
        </ol>
      </header>

      {(cancelled || context) && (
        <div className="mx-auto mb-8 max-w-4xl space-y-3">
          {cancelled && (
            <div role="status" className="rounded-sm bg-brand-yellow/15 p-4 text-center font-serif">
              {text.cancelled}
            </div>
          )}
          {context && (
            <div className="rounded-sm bg-muted p-4 text-center font-serif">{context}</div>
          )}
        </div>
      )}

      <MembershipCheckout
        locale={locale}
        options={options}
        initialType={type === 'SUPPORTING' || type === 'FULL' ? type : undefined}
        initialAmount={amount ? Number(amount) : undefined}
        signedIn={!!session?.user}
      />

      {!session?.user && (
        <p className="mx-auto mt-8 max-w-4xl text-center text-sm text-muted-foreground">
          {text.signInPrompt}{' '}
          <a
            href={loginPath(locale, localePath(locale, 'join'))}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {text.signInLink}
          </a>
        </p>
      )}
    </div>
  );
}
