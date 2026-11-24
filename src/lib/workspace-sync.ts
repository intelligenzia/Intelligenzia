import { Prisma } from '@prisma/client';
import type { WorkspaceAccount, WorkspaceState } from '@prisma/client';
import { prisma } from './prisma';
import { siteOrigin } from './stripe';
import * as google from './google-workspace';
import { CONTACT_EMAIL, formatDate, localePath, membershipState } from './membership';
import {
  WORKSPACE_GRACE_DAYS,
  canClaimAddress,
  checkLocalPart,
  normalizeLocalPart,
  type LocalPartProblem,
} from './workspace-plans';
import { membershipEnded } from './claude-plans';
import { boardEmail, sendQuietly, workspaceSuspendedEmail, workspaceWelcomeEmail } from './email';

// The @intelligenzia.fi address benefit: any member with an active
// membership picks the part before the @ and gets a Google Workspace account
// there. It is suspended when the membership ends and deleted after the
// grace period; renewing in time brings it back.
//
// Google calls are guarded by claiming the row (state -> BUSY in a single
// UPDATE), so two requests or a request and the daily job can't both act.

export const boardAddress = () => process.env.CLAUDE_BOARD_EMAIL || CONTACT_EMAIL;

const message = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 500);
const dashboardUrl = (locale: string) => `${siteOrigin()}${localePath(locale, 'dashboard')}`;

async function claim(id: string, from: WorkspaceState[]): Promise<boolean> {
  const { count } = await prisma.workspaceAccount.updateMany({
    where: { id, state: { in: from } },
    data: { state: 'BUSY' },
  });
  return count === 1;
}

export type Availability =
  | { ok: true; email: string }
  | { ok: false; reason: LocalPartProblem | 'taken' };

/** Whether `input` (the part before the @) is free for `userId` to take. */
export async function checkAvailability(input: string, userId: string): Promise<Availability> {
  const local = normalizeLocalPart(input);
  const problem = checkLocalPart(local);
  if (problem) return { ok: false, reason: problem };

  const email = `${local}@${google.workspaceDomain()}`;
  const held = await prisma.workspaceAccount.findUnique({ where: { email }, select: { userId: true } });
  if (held && held.userId !== userId) return { ok: false, reason: 'taken' };
  // Google also knows the board's own accounts, groups and aliases.
  if (google.workspaceConfigured() && (await google.addressTaken(email))) {
    return { ok: false, reason: 'taken' };
  }
  return { ok: true, email };
}

export type ClaimResult =
  | { status: 'active'; email: string }
  | { status: 'requested'; email: string }
  | { status: 'not_member' | 'already_has' | 'failed' }
  | { status: 'invalid'; reason: LocalPartProblem | 'taken' };

/**
 * Creates the member's address. With Google configured it exists when this
 * returns and the temporary password is on its way to the member's own
 * email; without, the board is asked to create it by hand.
 */
export async function claimAddress(userId: string, input: string, locale: string): Promise<ClaimResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: true, workspace: true },
  });
  if (!user?.email || !canClaimAddress(membershipState(user.membership))) return { status: 'not_member' };
  if (user.workspace) return { status: 'already_has' };

  const available = await checkAvailability(input, userId);
  if (!available.ok) return { status: 'invalid', reason: available.reason };
  const { email } = available;
  const configured = google.workspaceConfigured();

  let row: WorkspaceAccount;
  try {
    row = await prisma.workspaceAccount.create({
      data: { userId, email, locale, state: configured ? 'BUSY' : 'REQUESTED' },
    });
  } catch (err) {
    // Unique email (someone was faster) or unique userId (a double click).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const mine = await prisma.workspaceAccount.findUnique({ where: { userId } });
      return mine ? { status: 'already_has' } : { status: 'invalid', reason: 'taken' };
    }
    throw err;
  }

  if (!configured) {
    await sendQuietly(
      boardAddress(),
      boardEmail({
        subject: `Sähköposti: luo ${email}`,
        lines: [
          `${user.name ?? user.email} (${user.email}) valitsi jäsenetuna osoitteen ${email}.`,
          'Google Workspace -integraatiota ei ole otettu käyttöön, joten luo osoite käsin admin.google.com-palvelussa ja lähetä tunnukset jäsenen omaan sähköpostiin.',
        ],
      })
    );
    return { status: 'requested', email };
  }

  try {
    const { temporaryPassword } = await google.createAccount({
      email,
      name: user.name,
      personalEmail: user.email,
    });
    await prisma.workspaceAccount.update({ where: { id: row.id }, data: { state: 'ACTIVE', error: null } });
    await sendQuietly(
      user.email,
      workspaceWelcomeEmail({
        locale,
        name: user.name,
        address: email,
        temporaryPassword,
        manageUrl: dashboardUrl(locale),
      })
    );
    return { status: 'active', email };
  } catch (err) {
    // Nothing was created: free the address and let the member try again.
    await prisma.workspaceAccount.delete({ where: { id: row.id } });
    if (err instanceof google.AddressTaken) return { status: 'invalid', reason: 'taken' };
    console.error(`[workspace] creating ${email} failed:`, err);
    return { status: 'failed' };
  }
}

/** Brings back a suspended address after the member has renewed. */
export async function reactivateAddress(userId: string): Promise<'active' | 'not_member' | 'nothing' | 'failed'> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: true, workspace: true },
  });
  if (!user || !canClaimAddress(membershipState(user.membership))) return 'not_member';
  const row = user.workspace;
  if (!row || row.state !== 'SUSPENDED') return 'nothing';
  if (!(await claim(row.id, ['SUSPENDED']))) return 'nothing';
  try {
    await google.setSuspended(row.email, false);
    await prisma.workspaceAccount.update({
      where: { id: row.id },
      data: { state: 'ACTIVE', suspendedAt: null, error: null },
    });
    return 'active';
  } catch (err) {
    console.error(`[workspace] unsuspending ${row.email} failed:`, err);
    await prisma.workspaceAccount.update({ where: { id: row.id }, data: { state: 'SUSPENDED', error: message(err) } });
    return 'failed';
  }
}

export type WorkspaceMaintenance = { suspended: number; deleted: number; unstuck: number; errors: string[] };

/**
 * The daily job's share:
 * 1. Suspends addresses of members whose membership has ended.
 * 2. Frees rows stuck in BUSY by a run that died halfway.
 * 3. Deletes addresses suspended for longer than the grace period.
 */
export async function runWorkspaceMaintenance(now = new Date()): Promise<WorkspaceMaintenance> {
  const result: WorkspaceMaintenance = { suspended: 0, deleted: 0, unstuck: 0, errors: [] };
  const note = (what: string, err: unknown) => {
    console.error(`[workspace] maintenance: ${what}:`, err);
    result.errors.push(`${what}: ${message(err)}`);
  };
  const configured = google.workspaceConfigured();

  // 1. Membership over -> suspend (or, for hand-made ones, ask the board).
  const live = await prisma.workspaceAccount.findMany({
    where: { state: { in: ['ACTIVE', 'REQUESTED'] } },
    include: { user: { select: { email: true, name: true, membership: true } } },
  });
  for (const row of live) {
    if (!membershipEnded(membershipState(row.user.membership, now))) continue;
    if (row.state === 'REQUESTED') {
      await prisma.workspaceAccount.delete({ where: { id: row.id } });
      await sendQuietly(
        boardAddress(),
        boardEmail({
          subject: `Sähköposti: jäädytä ${row.email}`,
          lines: [`Jäsenyys on päättynyt (${row.user.email}). Jäädytä tai poista ${row.email} käsin.`],
        })
      );
      continue;
    }
    if (!configured || !(await claim(row.id, ['ACTIVE']))) continue;
    try {
      await google.setSuspended(row.email, true);
      await prisma.workspaceAccount.update({
        where: { id: row.id },
        data: { state: 'SUSPENDED', suspendedAt: now, error: null },
      });
      result.suspended++;
      await sendQuietly(
        row.user.email,
        workspaceSuspendedEmail({
          locale: row.locale,
          name: row.user.name,
          address: row.email,
          deleteOn: formatDate(new Date(now.getTime() + WORKSPACE_GRACE_DAYS * 86_400_000), row.locale),
          renewUrl: `${siteOrigin()}${localePath(row.locale, 'join')}`,
        })
      );
    } catch (err) {
      await prisma.workspaceAccount.update({ where: { id: row.id }, data: { state: 'ACTIVE', error: message(err) } });
      note(`suspending ${row.email}`, err);
    }
  }

  if (!configured) return result;

  // 2. BUSY for over an hour: a run died between Google and the database.
  const stuck = await prisma.workspaceAccount.findMany({
    where: { state: 'BUSY', updatedAt: { lt: new Date(now.getTime() - 3_600_000) } },
    include: { user: { select: { email: true } } },
  });
  for (const row of stuck) {
    try {
      // A row that has been BUSY since it was created died while creating
      // the account; any other BUSY row was suspending, unsuspending or
      // deleting, and the daily steps below simply run again.
      const creating = Math.abs(row.updatedAt.getTime() - row.createdAt.getTime()) < 5_000;
      const exists = await google.addressTaken(row.email);
      if (!exists) {
        await prisma.workspaceAccount.delete({ where: { id: row.id } });
      } else {
        await prisma.workspaceAccount.update({
          where: { id: row.id },
          data: row.suspendedAt
            ? { state: 'SUSPENDED' }
            : { state: 'ACTIVE', ...(creating ? { error: 'interrupted: check the account in admin.google.com' } : {}) },
        });
        if (creating) {
          await sendQuietly(
            boardAddress(),
            boardEmail({
              subject: `Sähköposti: tarkista ${row.email}`,
              lines: [
                `Osoitteen ${row.email} luonti keskeytyi, mutta tili on olemassa. Jäsen (${row.user.email}) ei välttämättä saanut salasanaa: nollaa se admin.google.com-palvelussa ja lähetä jäsenelle.`,
              ],
            })
          );
        }
      }
      result.unstuck++;
    } catch (err) {
      note(`unsticking ${row.email}`, err);
    }
  }

  // 3. Past the grace period: delete the account and free the address.
  const cutoff = new Date(now.getTime() - WORKSPACE_GRACE_DAYS * 86_400_000);
  const expired = await prisma.workspaceAccount.findMany({
    where: { state: 'SUSPENDED', suspendedAt: { lt: cutoff } },
  });
  for (const row of expired) {
    if (!(await claim(row.id, ['SUSPENDED']))) continue;
    try {
      await google.deleteAccount(row.email);
      await prisma.workspaceAccount.delete({ where: { id: row.id } });
      result.deleted++;
    } catch (err) {
      await prisma.workspaceAccount.update({ where: { id: row.id }, data: { state: 'SUSPENDED', error: message(err) } });
      note(`deleting ${row.email}`, err);
    }
  }

  return result;
}

/**
 * Part of erasing a member (GDPR art. 17): deletes the address straight
 * away instead of after the grace period. Never throws; anything that fails
 * goes to the board to finish by hand.
 */
export async function deleteAddressForErasure(userId: string): Promise<void> {
  const row = await prisma.workspaceAccount.findUnique({
    where: { userId },
    include: { user: { select: { email: true } } },
  });
  if (!row) return;
  let problem: string | null = row.state === 'REQUESTED' ? 'osoite luotiin käsin' : null;
  if (!problem) {
    try {
      await google.deleteAccount(row.email);
    } catch (err) {
      problem = message(err);
      console.error(`[workspace] erasure: deleting ${row.email} failed:`, err);
    }
  }
  if (problem) {
    await sendQuietly(
      boardAddress(),
      boardEmail({
        subject: `Sähköposti: poista ${row.email}`,
        lines: [
          `Jäsen (${row.user.email}) poisti tilinsä. Osoitetta ${row.email} ei voitu poistaa automaattisesti, joten poista se käsin admin.google.com-palvelussa.`,
          `Syy: ${problem}`,
        ],
      })
    );
  }
}
