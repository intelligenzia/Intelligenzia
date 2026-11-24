import type { ClaudeSubscription, WorkspaceAccount } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { formatDate, routeFor } from '@/lib/membership';
import { CLAUDE_TIERS, claudeState } from '@/lib/claude-plans';
import { ClaudeManageButton, ClaudeSubscribe } from '@/components/claude-subscription';

type Props = {
  locale: string;
  claude: ClaudeSubscription | null;
  /** The member's @intelligenzia.fi address, which Claude signs in with. */
  workspace: WorkspaceAccount | null;
  /** The membership is paid up, so a new subscription can be started. */
  canStart: boolean;
  /** Back from Stripe Checkout, possibly before the webhook arrived. */
  returned: boolean;
};

/**
 * The Claude add-on on the member page. Members-only: renders nothing for
 * anyone who can't subscribe and has nothing running.
 */
export function ClaudeCard({ locale, claude, workspace, canStart, returned }: Props) {
  const fi = locale === 'fi';
  const state = claudeState(claude);
  if (state.kind === 'none' && !canStart) return null;

  const date = (d: Date | null) => (d ? formatDate(d, locale) : null);
  const more = (
    <Link
      href={routeFor(locale, 'claude')}
      className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      {fi ? 'Lisätiedot ja käyttöehdot' : 'Details and terms'}
    </Link>
  );

  let badge: { label: string; variant: 'default' | 'destructive' | 'outline' };
  let body: React.ReactNode;

  if (state.kind === 'none') {
    badge = { label: fi ? 'Jäsenetu' : 'Member benefit', variant: 'outline' };
    body = (
      <>
        <p className="font-serif text-muted-foreground">
          {fi
            ? 'Intelligenzia on voittoa tavoittelematon organisaatio Anthropicin ohjelmassa, joten jäsenet saavat Clauden yksityistä hintaa halvemmalla. Tilaus on jäsenyydestä erillinen lisäpalvelu, eikä se vaikuta jäsenyyteesi tai äänioikeuteesi. Claudeen kirjaudutaan @intelligenzia.fi-osoitteellasi.'
            : "Intelligenzia is a nonprofit in Anthropic's programme, so members get Claude for less than the individual price. It's an add-on, separate from your membership, and doesn't affect your membership or voting rights. You sign in to Claude with your @intelligenzia.fi address."}
        </p>
        {returned && (
          <p className="text-sm">
            {fi
              ? 'Maksuasi käsitellään. Päivitä sivu hetken kuluttua.'
              : 'Your payment is being processed. Refresh the page in a moment.'}
          </p>
        )}
        {workspace && (workspace.state === 'ACTIVE' || workspace.state === 'REQUESTED') ? (
          <ClaudeSubscribe locale={locale} />
        ) : (
          <p className="rounded-md border p-4 text-sm">
            {fi
              ? 'Luo ensin @intelligenzia.fi-osoitteesi Sähköposti-kohdassa. Claude kirjautuu sillä.'
              : 'Create your @intelligenzia.fi address under Email first. Claude signs in with it.'}
          </p>
        )}
        {more}
      </>
    );
  } else {
    const tier = CLAUDE_TIERS[state.tier].label;
    const address = workspace ? (
      <p>
        {fi ? 'Kirjaudu Claudeen osoitteella ' : 'Sign in to Claude with '}
        <span className="break-all font-medium">{workspace.email}</span>
        {fi
          ? '. Kutsu Claude-organisaatioon tulee siihen osoitteeseen.'
          : '. The invitation to the Claude organisation arrives at that address.'}
      </p>
    ) : null;

    if (state.kind === 'active') {
      badge = { label: fi ? 'Käytössä' : 'Active', variant: 'default' };
      body = (
        <>
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-brand-green" />
            <div>
              <p className="display-md text-2xl">{fi ? `${tier} on käytössä` : `You have ${tier}`}</p>
              {state.until && (
                <p className="mt-2 font-serif text-muted-foreground">
                  {state.ending
                    ? fi
                      ? `Tilaus päättyy ${date(state.until)}, eikä sitä veloiteta enää.`
                      : `Ends on ${date(state.until)} and won't be charged again.`
                    : fi
                      ? `Seuraava veloitus ${date(state.until)}.`
                      : `Next charge on ${date(state.until)}.`}
                </p>
              )}
            </div>
          </div>
          {address}
          <ClaudeManageButton locale={locale} label={state.ending ? (fi ? 'Jatka tilausta' : 'Keep subscription') : undefined} />
          {more}
        </>
      );
    } else {
      badge = { label: fi ? 'Maksu epäonnistui' : 'Payment failed', variant: 'destructive' };
      body = (
        <>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-brand-yellow" />
            <div>
              <p className="display-md text-2xl">{fi ? 'Claude-maksu epäonnistui' : 'Your Claude payment failed'}</p>
              <p className="mt-2 font-serif text-muted-foreground">
                {fi
                  ? 'Stripe yrittää veloitusta uudelleen muutaman päivän ajan. Päivitä maksutapa, niin Claude jatkuu katkotta.'
                  : 'Stripe retries the charge for a few days. Update your card to keep Claude without a gap.'}
              </p>
            </div>
          </div>
          {address}
          <ClaudeManageButton locale={locale} label={fi ? 'Päivitä maksutapa' : 'Update card'} />
        </>
      );
    }
  }

  return (
    <Card className={`${state.kind === 'payment_issue' ? 'border-brand-yellow' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Claude
          </span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{body}</CardContent>
    </Card>
  );
}
