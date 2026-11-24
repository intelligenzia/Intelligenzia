import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/navigation';
import { noIndex } from '@/lib/seo';
import { CONTACT_EMAIL, localePath, loginPath, membershipState, routeFor } from '@/lib/membership';
import { CLAUDE_TIERS, CLAUDE_TIER_ORDER, canStartClaude } from '@/lib/claude-plans';
import { WORKSPACE_GRACE_DAYS } from '@/lib/workspace-plans';

// Members only. The Claude add-on isn't advertised publicly: this page is
// reachable only when signed in with an active membership (or a Claude
// subscription), and it's kept out of search engines and the sitemap.

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'en' ? 'Claude for members' : 'Claude jäsenille',
    robots: noIndex,
  };
}

type Section = { title: string; items: string[] };

const price = (fi: boolean) =>
  CLAUDE_TIER_ORDER.map((t) => `${CLAUDE_TIERS[t].label} ${CLAUDE_TIERS[t].price} €/${fi ? 'kk' : 'month'}`).join(
    fi ? ' ja ' : ' and '
  );

function terms(fi: boolean): Section[] {
  const g = WORKSPACE_GRACE_DAYS;
  if (fi) {
    return [
      {
        title: '1. Palvelu',
        items: [
          'Intelligenzia ry ("yhdistys") tarjoaa jäsenilleen pääsyn Anthropicin Claude-palveluun yhdistyksen organisaatiotilin kautta.',
          'Palvelu on jäsenyydestä erillinen, vapaaehtoinen lisäpalvelu. Sen maksu ei ole jäsenmaksu. Palvelun tilaaminen ei vaikuta jäsenyyden tyyppiin, äänioikeuteen tai muihin jäsenen oikeuksiin.',
          'Käyttömäärät ja ominaisuudet määräytyvät Anthropicin kulloinkin voimassa olevien ehtojen mukaan. Yhdistys ei takaa palvelun saatavuutta tai tiettyä käyttömäärää.',
        ],
      },
      {
        title: '2. Kuka voi tilata',
        items: [
          'Palvelun voi tilata varsinainen jäsen tai kannatusjäsen, jonka jäsenmaksu on maksettu.',
          'Hallitus päättää jäseneksi hyväksymisestä sääntöjen mukaisesti, eikä palvelu velvoita hyväksymään ketään. Hallitus voi rajoittaa tilaajien määrää, jos se on tarpeen palvelun järjestämiseksi.',
        ],
      },
      {
        title: '3. Hinnat ja laskutus',
        items: [
          `Hinnat ovat ${price(true)}, ja ne laskutetaan kuukausittain etukäteen Stripen kautta.`,
          'Hallitus voi muuttaa hintaa esimerkiksi silloin, kun Anthropicin hinnat muuttuvat. Muutoksesta ilmoitetaan sähköpostitse vähintään 30 päivää ennen sen voimaantuloa, ja tilauksen voi lopettaa ennen muutosta.',
          'Jos maksu epäonnistuu, Stripe yrittää veloitusta uudelleen muutaman päivän ajan. Jos maksua ei saada, tilaus päättyy.',
        ],
      },
      {
        title: '4. Tilauksen päättyminen',
        items: [
          'Sitoutumisaikaa ei ole. Tilauksen voi lopettaa milloin tahansa Jäsenyyteni-sivulla, ja se päättyy kuluvan laskutuskauden lopussa. Jo maksettuja kuukausia ei hyvitetä.',
          'Palvelu kuuluu vain jäsenille. Jos jäsenyys päättyy, tilaus ei enää uusiudu, vaan se päättyy kuluvan laskutuskauden lopussa.',
          'Yhdistys voi lopettaa palvelun kaikilta, jos Anthropic muuttaa ehtojaan tai yhdistyksen asema voittoa tavoittelemattomana organisaationa päättyy. Tilaajille ilmoitetaan niin pian kuin mahdollista, ja käyttämättömältä ajalta maksettu osuus hyvitetään.',
        ],
      },
      {
        title: '5. Sähköpostiosoite',
        items: [
          'Claudeen kirjaudutaan @intelligenzia.fi-osoitteella, joka on erillinen jäsenetu. Luo osoite ennen tilausta Jäsenyyteni-sivulla.',
          `Osoite ei riipu Claude-tilauksesta: se säilyy, vaikka tilaus päättyy. Kun jäsenyys päättyy, osoite jäädytetään ja poistetaan sisältöineen ${g} päivän kuluttua, ellei jäsenyyttä uusita sitä ennen.`,
          'Jos poistat tilisi Jäsenyyteni-sivulla, osoite poistetaan heti.',
        ],
      },
      {
        title: '6. Käyttäjän vastuu',
        items: [
          'Vastaat itse kaikesta, mitä teet palvelun avulla, ja siitä sisällöstä, jota sillä tuotat.',
          'Sitoudut noudattamaan Anthropicin käyttöehtoja ja käyttöpolitiikkaa (anthropic.com/legal/aup) sekä Suomen lakia.',
          'Tunnukset ovat henkilökohtaiset. Niitä ei saa antaa toisen käyttöön.',
          'Jos rikot näitä ehtoja tai Anthropicin käyttöpolitiikkaa, hallitus voi sulkea tunnuksesi heti. Maksuja ei tällöin hyvitetä.',
          'Yhdistys ei vastaa palvelun käytöstä aiheutuvista vahingoista, katkoksista tai Clauden tuottaman sisällön virheistä.',
        ],
      },
      {
        title: '7. Yksityisyys',
        items: [
          'Yhdistys ei lue, käytä tai vie keskustelujasi, tiedostojasi tai muuta palvelussa olevaa sisältöä.',
          'Organisaatiotilin ylläpitäjillä on teknisesti mahdollisuus viedä käyttäjien dataa. Ylläpitäjinä toimivat vain hallituksen nimeämät henkilöt, ja dataa viedään vain, jos laki tai viranomainen sitä vaatii. Sinulle ilmoitetaan tästä, ellei laki sitä estä.',
          'Yhdistys käsittelee palvelun järjestämiseksi nimeäsi, sähköpostiosoitteitasi ja Stripen asiakastunnistettasi. Anthropic saa @intelligenzia.fi-osoitteesi ja nimesi, kun hallitus lisää sinut Claude-organisaatioon. Korttitiedot käsittelee Stripe, eikä yhdistys näe niitä. Lisätietoja tietosuojaselosteessa.',
        ],
      },
      {
        title: '8. Ehtojen muuttaminen',
        items: [
          'Hallitus voi muuttaa näitä ehtoja. Olennaisista muutoksista ilmoitetaan sähköpostitse vähintään 30 päivää ennen niiden voimaantuloa.',
        ],
      },
    ];
  }
  return [
    {
      title: '1. The service',
      items: [
        "Intelligenzia ry (\"the association\") gives its members access to Anthropic's Claude through the association's organisation account.",
        "The service is an optional add-on, separate from membership. Its fee is not a membership fee. Subscribing doesn't change your membership type, voting rights or any other member's right.",
        "Usage limits and features follow Anthropic's terms as they stand at the time. The association doesn't guarantee availability or any particular amount of usage.",
      ],
    },
    {
      title: '2. Who can subscribe',
      items: [
        'Full members and supporting members whose membership fee is paid.',
        "The board admits members under the association's rules, and the service obliges it to admit no one. The board may limit the number of subscribers if that's needed to run the service.",
      ],
    },
    {
      title: '3. Prices and billing',
      items: [
        `The prices are ${price(false)}, billed monthly in advance through Stripe.`,
        "The board may change the price, for example when Anthropic's prices change. You're told by email at least 30 days before a change, and you can cancel before it takes effect.",
        "If a payment fails, Stripe retries it for a few days. If it still can't be collected, the subscription ends.",
      ],
    },
    {
      title: '4. Ending the subscription',
      items: [
        "There's no minimum term. Cancel any time on the My Membership page; the subscription ends at the end of the current billing period. Months already paid aren't refunded.",
        "The service is for members only. If your membership ends, the subscription stops renewing and ends at the end of the current billing period.",
        'The association may end the service for everyone if Anthropic changes its terms or the association stops qualifying as a nonprofit. Subscribers are told as soon as possible, and the unused part of any payment is refunded.',
      ],
    },
    {
      title: '5. Your email address',
      items: [
        'You sign in to Claude with your @intelligenzia.fi address, which is a separate member benefit. Create it on the My Membership page before subscribing.',
        `The address doesn't depend on the Claude subscription: it stays when the subscription ends. When your membership ends, the address is suspended and deleted with its contents after ${g} days, unless you renew before then.`,
        'If you delete your account on the My Membership page, the address is deleted straight away.',
      ],
    },
    {
      title: '6. Your responsibilities',
      items: [
        "You're responsible for everything you do with the service and for the content you produce with it.",
        "You agree to follow Anthropic's terms and usage policy (anthropic.com/legal/aup) and Finnish law.",
        "Your account is personal. Don't let anyone else use it.",
        "If you break these terms or Anthropic's usage policy, the board may close your account straight away, without a refund.",
        "The association isn't liable for damage from using the service, for outages, or for errors in what Claude produces.",
      ],
    },
    {
      title: '7. Privacy',
      items: [
        "The association doesn't read, use or export your conversations, files or anything else you keep in the service.",
        "Admins of the organisation account can technically export users' data. Only people the board appoints are admins, and data is exported only when the law or an authority requires it. You're told when this happens, unless the law prevents it.",
        "To run the service, the association processes your name, your email addresses and your Stripe customer ID. Anthropic receives your @intelligenzia.fi address and name when the board adds you to the Claude organisation. Card details are handled by Stripe; the association never sees them. See the privacy policy for more.",
      ],
    },
    {
      title: '8. Changes to these terms',
      items: [
        "The board may change these terms. You're told about significant changes by email at least 30 days before they take effect.",
      ],
    },
  ];
}

export default async function ClaudeTermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const fi = locale === 'fi';

  const session = await auth();
  if (!session?.user) {
    redirect(loginPath(locale, localePath(locale, 'claude')));
  }
  const [membership, claude] = await Promise.all([
    prisma.membership.findUnique({ where: { userId: session.user.id } }),
    prisma.claudeSubscription.findUnique({ where: { userId: session.user.id }, select: { id: true } }),
  ]);
  if (!canStartClaude(membershipState(membership)) && !claude) {
    redirect(localePath(locale, 'dashboard'));
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <article className="mx-auto max-w-2xl">
        <Link
          href={routeFor(locale, 'dashboard')}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← {fi ? 'Jäsenyyteni' : 'My Membership'}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          {fi ? 'Claude jäsenille' : 'Claude for members'}
        </h1>
        <p className="mt-4 font-serif text-lg text-muted-foreground">
          {fi
            ? 'Intelligenzia on rekisteröity Anthropicille voittoa tavoittelemattomaksi organisaatioksi. Sen ansiosta jäsenet saavat Clauden selvästi yksityistä hintaa halvemmalla.'
            : 'Intelligenzia is registered with Anthropic as a nonprofit, so members get Claude for well under the individual price.'}
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {CLAUDE_TIER_ORDER.map((t) => (
            <li key={t} className="rounded-md border p-4">
              <p className="font-semibold">{CLAUDE_TIERS[t].label}</p>
              <p className="font-mono text-sm tabular-nums">
                {CLAUDE_TIERS[t].price} € / {fi ? 'kk' : 'month'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{CLAUDE_TIERS[t].usage[fi ? 'fi' : 'en']}</p>
            </li>
          ))}
        </ul>

        <h2 className="display-md mt-12 text-2xl">{fi ? 'Käyttöehdot' : 'Terms'}</h2>
        {terms(fi).map((section) => (
          <section key={section.title} className="mt-6">
            <h3 className="font-semibold">{section.title}</h3>
            <ol className="mt-2 list-decimal space-y-2 pl-5 font-serif text-muted-foreground">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>
        ))}

        <p className="mt-10 text-sm text-muted-foreground">
          {fi ? 'Kysyttävää? ' : 'Questions? '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4 hover:text-foreground">
            {CONTACT_EMAIL}
          </a>
        </p>
      </article>
    </div>
  );
}
