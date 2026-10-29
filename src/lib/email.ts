import { CONTACT_EMAIL } from './membership';

const FROM = process.env.FROM_EMAIL || 'Intelligenzia <noreply@intelligenzia.fi>';

type Email = { to: string; subject: string; text: string; html: string };

/** Sends through Resend's REST API, the same key the magic-link provider uses. */
export async function sendEmail(email: Email, apiKey = process.env.AUTH_RESEND_KEY): Promise<void> {
  if (!apiKey) throw new Error('AUTH_RESEND_KEY is not set');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, ...email }),
  });
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** One plain, client-safe layout: a heading, paragraphs, an optional button. */
function layout(opts: {
  heading: string;
  paragraphs: string[];
  button?: { label: string; href: string };
  footer: string;
}): string {
  const p = (text: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#1f1f1f">${text}</p>`;
  const button = opts.button
    ? `<p style="margin:24px 0 28px"><a href="${escape(opts.button.href)}" style="display:inline-block;background:#c42b48;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:12px 22px;border-radius:4px">${escape(opts.button.label)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f5f2">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f2;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:6px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<tr><td>
<p style="margin:0 0 24px;font-size:14px;font-weight:700;letter-spacing:0.02em;color:#1f1f1f">Intelligenzia</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1f1f1f">${escape(opts.heading)}</h1>
${opts.paragraphs.map(p).join('\n')}
${button}
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b6b6b">${opts.footer}</p>
</td></tr></table>
</td></tr></table></body></html>`;
}

export function magicLinkEmail(locale: string, url: string): Omit<Email, 'to'> {
  const fi = locale !== 'en';
  const heading = fi ? 'Kirjaudu Intelligenziaan' : 'Sign in to Intelligenzia';
  const body = fi
    ? 'Kirjaudu sisään alla olevasta painikkeesta. Linkki on voimassa 24 tuntia ja toimii kerran.'
    : 'Use the button below to sign in. The link works once and expires in 24 hours.';
  const ignore = fi
    ? 'Jos et pyytänyt tätä viestiä, voit jättää sen huomiotta.'
    : "If you didn't ask for this, you can ignore this email.";
  const label = fi ? 'Kirjaudu sisään' : 'Sign in';

  return {
    subject: fi ? 'Kirjautumislinkki – Intelligenzia' : 'Your sign-in link – Intelligenzia',
    text: `${heading}\n\n${body}\n\n${url}\n\n${ignore}`,
    html: layout({
      heading,
      paragraphs: [escape(body)],
      button: { label, href: url },
      footer: escape(ignore),
    }),
  };
}

export type ConfirmationKind = 'welcome' | 'renewal' | 'upgrade';

export function membershipConfirmationEmail(opts: {
  locale: string;
  kind: ConfirmationKind;
  name: string | null;
  typeLabel: string;
  /** Already formatted, e.g. "renews on 3.11.2027" / "valid until 3.11.2027". */
  validity: string;
  manageUrl: string;
}): Omit<Email, 'to'> {
  const fi = opts.locale !== 'en';
  const firstName = opts.name?.split(' ')[0];

  const heading = {
    welcome: fi ? 'Tervetuloa Intelligenziaan!' : 'Welcome to Intelligenzia!',
    renewal: fi ? 'Jäsenyytesi on uusittu' : 'Your membership is renewed',
    upgrade: fi ? 'Olet nyt varsinainen jäsen' : "You're now a full member",
  }[opts.kind];

  const greeting = firstName ? (fi ? `Hei ${firstName},` : `Hi ${firstName},`) : fi ? 'Hei,' : 'Hi,';
  const thanks = fi
    ? 'kiitos, että tuet kognitiotieteen yhteisöä. Maksusi on vastaanotettu.'
    : 'thank you for supporting the cognitive science community. Your payment has been received.';
  const details = `${opts.typeLabel} · ${opts.validity}`;
  const manage = fi
    ? 'Voit tarkistaa jäsenyytesi, päivittää maksutavan tai perua uusiutumisen Jäsenyyteni-sivulla. Kirjaudu samalla sähköpostiosoitteella, johon tämä viesti tuli.'
    : 'You can check your membership, update your card or stop renewal on the My Membership page. Sign in with the address this email was sent to.';
  const footer = fi
    ? `Kysyttävää? Vastaa hallitukselle osoitteeseen <a href="mailto:${CONTACT_EMAIL}" style="color:#6b6b6b">${CONTACT_EMAIL}</a>.`
    : `Questions? Write to the board at <a href="mailto:${CONTACT_EMAIL}" style="color:#6b6b6b">${CONTACT_EMAIL}</a>.`;
  const label = fi ? 'Jäsenyyteni' : 'My membership';

  return {
    subject: heading,
    text: [heading, '', `${greeting} ${thanks}`, '', details, '', manage, opts.manageUrl, '', `${CONTACT_EMAIL}`].join('\n'),
    html: layout({
      heading,
      paragraphs: [
        `${escape(greeting)} ${escape(thanks)}`,
        `<strong>${escape(details)}</strong>`,
        escape(manage),
      ],
      button: { label, href: opts.manageUrl },
      footer,
    }),
  };
}
