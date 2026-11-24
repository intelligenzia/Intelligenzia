import { createSign, randomInt } from 'crypto';
import { temporaryPassword } from './workspace-plans';

// @intelligenzia.fi Google Workspace accounts for members, through the Admin SDK
// Directory API. A service account with domain-wide delegation acts as a
// Workspace admin; no Google client library, just a signed JWT and fetch.
//
// Environment:
//   GOOGLE_SERVICE_ACCOUNT_KEY   the service account's JSON key (raw or base64)
//   GOOGLE_WORKSPACE_ADMIN_EMAIL the admin the service account acts as
//   CLAUDE_WORKSPACE_DOMAIN      domain for new addresses (default intelligenzia.fi)
//   CLAUDE_WORKSPACE_ORG_UNIT    optional org unit for member accounts, e.g. /Jasenet
//
// Without the first two, workspaceConfigured() is false and the board
// creates the accounts by hand from the notification email.

const SCOPE = 'https://www.googleapis.com/auth/admin.directory.user';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERS_URL = 'https://admin.googleapis.com/admin/directory/v1/users';

export class WorkspaceNotConfigured extends Error {
  constructor() {
    super('Google Workspace is not configured');
  }
}

type ServiceAccountKey = { client_email: string; private_key: string };

function readKey(): ServiceAccountKey | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw || !process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL) return null;
  const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const key = JSON.parse(json) as Partial<ServiceAccountKey>;
  if (!key.client_email || !key.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY has no client_email or private_key');
  }
  return { client_email: key.client_email, private_key: key.private_key };
}

export function workspaceConfigured(): boolean {
  try {
    return readKey() !== null;
  } catch {
    return false;
  }
}

export function workspaceDomain(): string {
  return (process.env.CLAUDE_WORKSPACE_DOMAIN || 'intelligenzia.fi').trim().toLowerCase();
}

const base64url = (input: string | Buffer) => Buffer.from(input).toString('base64url');

let cached: { token: string; expires: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;
  const key = readKey();
  if (!key) throw new WorkspaceNotConfigured();

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      sub: process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(key.private_key);
  const assertion = `${header}.${claims}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`Google token error ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, expires: Date.now() + body.expires_in * 1000 };
  return body.access_token;
}

async function directory(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  return fetch(`${USERS_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

async function fail(res: Response, what: string): Promise<never> {
  throw new Error(`Google ${what} failed ${res.status}: ${await res.text()}`);
}

/** Whether an address is taken, as a user or as anyone's alias. */
export async function addressTaken(email: string): Promise<boolean> {
  const res = await directory(`/${encodeURIComponent(email)}?fields=primaryEmail`);
  if (res.status === 404) return false;
  if (!res.ok) await fail(res, 'user lookup');
  return true;
}

export class AddressTaken extends Error {
  constructor(email: string) {
    super(`${email} is taken`);
  }
}

/**
 * Creates the account at exactly the address the member chose. Throws
 * AddressTaken if Google already has it (as a user, alias or group). The
 * password must be changed at first sign-in.
 */
export async function createAccount(opts: {
  email: string;
  name: string | null;
  personalEmail: string;
}): Promise<{ temporaryPassword: string }> {
  if (!workspaceConfigured()) throw new WorkspaceNotConfigured();
  const words = (opts.name ?? '').trim().split(/\s+/).filter(Boolean);
  const givenName = words[0] ?? opts.email.split('@')[0];
  const familyName = words.length > 1 ? words.slice(1).join(' ') : '-';
  const password = temporaryPassword(randomInt);

  const res = await directory('', {
    method: 'POST',
    body: JSON.stringify({
      primaryEmail: opts.email,
      name: { givenName, familyName },
      password,
      changePasswordAtNextLogin: true,
      recoveryEmail: opts.personalEmail,
      ...(process.env.CLAUDE_WORKSPACE_ORG_UNIT ? { orgUnitPath: process.env.CLAUDE_WORKSPACE_ORG_UNIT } : {}),
    }),
  });
  if (res.status === 409) throw new AddressTaken(opts.email);
  if (!res.ok) await fail(res, 'user create');
  return { temporaryPassword: password };
}

export async function setSuspended(email: string, suspended: boolean): Promise<void> {
  const res = await directory(`/${encodeURIComponent(email)}`, {
    method: 'PATCH',
    body: JSON.stringify({ suspended }),
  });
  if (!res.ok) await fail(res, suspended ? 'suspend' : 'unsuspend');
}

/** Deletes the account. An account that's already gone counts as deleted. */
export async function deleteAccount(email: string): Promise<void> {
  const res = await directory(`/${encodeURIComponent(email)}`, { method: 'DELETE' });
  if (res.status === 404) return;
  if (!res.ok) await fail(res, 'user delete');
}
