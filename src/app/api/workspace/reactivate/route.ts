import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { reactivateAddress } from '@/lib/workspace-sync';

/** Brings back a suspended address once the membership is renewed. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const result = await reactivateAddress(session.user.id);
  const status = { active: 200, nothing: 409, not_member: 403, failed: 502 }[result];
  return NextResponse.json({ status: result }, { status });
}
