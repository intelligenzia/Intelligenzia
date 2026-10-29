import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AccountDeletionError, deleteAccount } from '@/lib/account';

/**
 * Self-service erasure (GDPR art. 17). The member confirms by typing their
 * own email, so a stray click or a forged request without it does nothing.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { confirmEmail } = await req.json().catch(() => ({}));
  if (
    typeof confirmEmail !== 'string' ||
    confirmEmail.trim().toLowerCase() !== session.user.email.toLowerCase()
  ) {
    return NextResponse.json({ error: 'confirmation_mismatch' }, { status: 400 });
  }

  try {
    await deleteAccount(session.user.id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof AccountDeletionError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error('[account] deletion failed:', err);
    return NextResponse.json({ error: 'deletion_failed' }, { status: 500 });
  }
}
