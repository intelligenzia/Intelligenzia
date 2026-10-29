import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AccountDeletionError, deleteAccount } from '@/lib/account';

/** Erasure on a request sent to the board, e.g. by email. Admins only. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await req.json().catch(() => ({}));
  if (typeof userId !== 'string' || !userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }
  if (userId === session.user.id) {
    return NextResponse.json({ error: 'Delete your own account from your membership page' }, { status: 400 });
  }

  try {
    await deleteAccount(userId);
    console.info(`[account] ${session.user.email} deleted user ${userId} on request`);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof AccountDeletionError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error('[account] admin deletion failed:', err);
    return NextResponse.json({ error: 'deletion_failed' }, { status: 500 });
  }
}
