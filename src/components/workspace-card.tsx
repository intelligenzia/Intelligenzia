import type { WorkspaceAccount } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AtSign, ExternalLink } from 'lucide-react';
import { CONTACT_EMAIL, formatDate } from '@/lib/membership';
import { WORKSPACE_GRACE_DAYS } from '@/lib/workspace-plans';
import { ReactivateAddress, WorkspaceClaim } from '@/components/workspace-claim';

type Props = {
  locale: string;
  workspace: WorkspaceAccount | null;
  /** Paid-up member: can take an address or bring a suspended one back. */
  canClaim: boolean;
  domain: string;
  suggestion: string;
};

/** The @intelligenzia.fi address benefit. Members only. */
export function WorkspaceCard({ locale, workspace, canClaim, domain, suggestion }: Props) {
  const fi = locale === 'fi';
  if (!workspace && !canClaim) return null;

  let badge: { label: string; variant: 'default' | 'secondary' | 'outline' };
  let body: React.ReactNode;

  if (!workspace) {
    badge = { label: fi ? 'Jäsenetu' : 'Member benefit', variant: 'outline' };
    body = (
      <>
        <p className="font-serif text-muted-foreground">
          {fi
            ? `Jäsenenä saat oman @${domain}-sähköpostiosoitteen (Gmail). Valitse itse, mitä @-merkin eteen tulee. Osoite on käytössäsi niin kauan kuin jäsenyytesi on voimassa.`
            : `As a member you get your own @${domain} email address (Gmail). You choose what goes before the @. It's yours for as long as your membership is valid.`}
        </p>
        <WorkspaceClaim locale={locale} domain={domain} suggestion={suggestion} />
      </>
    );
  } else if (workspace.state === 'ACTIVE') {
    badge = { label: fi ? 'Käytössä' : 'Active', variant: 'default' };
    body = (
      <>
        <p className="break-all font-mono text-lg">{workspace.email}</p>
        <a
          href="https://mail.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
        >
          {fi ? 'Avaa Gmail' : 'Open Gmail'}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <p className="text-sm text-muted-foreground">
          {fi
            ? `Salasana unohtui? Kirjoita ${CONTACT_EMAIL}, niin hallitus nollaa sen.`
            : `Forgot the password? Write to ${CONTACT_EMAIL} and the board resets it.`}
        </p>
      </>
    );
  } else if (workspace.state === 'SUSPENDED') {
    const deleteOn = workspace.suspendedAt
      ? formatDate(new Date(workspace.suspendedAt.getTime() + WORKSPACE_GRACE_DAYS * 86_400_000), locale)
      : null;
    badge = { label: fi ? 'Jäädytetty' : 'Suspended', variant: 'secondary' };
    body = (
      <>
        <p className="break-all font-mono text-lg">{workspace.email}</p>
        {canClaim ? (
          <>
            <p className="font-serif text-muted-foreground">
              {fi
                ? 'Jäsenyytesi on taas voimassa, joten saat osoitteen takaisin.'
                : 'Your membership is valid again, so you can have the address back.'}
            </p>
            <ReactivateAddress locale={locale} />
          </>
        ) : (
          <p className="font-serif text-muted-foreground">
            {fi
              ? `Osoite on jäädytetty, koska jäsenyytesi päättyi.${deleteOn ? ` Se poistetaan sisältöineen ${deleteOn}, ellei jäsenyyttä uusita sitä ennen.` : ''}`
              : `The address is suspended because your membership ended.${deleteOn ? ` It will be deleted with its contents on ${deleteOn} unless you renew before then.` : ''}`}
          </p>
        )}
      </>
    );
  } else {
    // REQUESTED (made by hand) or BUSY (being created right now).
    badge = { label: fi ? 'Luodaan' : 'Being set up', variant: 'outline' };
    body = (
      <>
        <p className="break-all font-mono text-lg">{workspace.email}</p>
        <p className="font-serif text-muted-foreground">
          {fi
            ? 'Osoitettasi luodaan. Saat tunnukset omaan sähköpostiisi.'
            : 'Your address is being set up. The sign-in details arrive at your own email.'}
        </p>
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AtSign className="h-5 w-5" />
            {fi ? 'Sähköposti' : 'Email'}
          </span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{body}</CardContent>
    </Card>
  );
}
