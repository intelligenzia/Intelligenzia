import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAvailability } from '@/lib/workspace-sync';

/** Live check for the address field: is this part before the @ free? Members only. */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const local = req.nextUrl.searchParams.get('local') ?? '';
  try {
    return NextResponse.json(await checkAvailability(local, session.user.id));
  } catch (error) {
    console.error('[workspace] availability check failed:', error);
    return NextResponse.json({ error: 'check_failed' }, { status: 500 });
  }
}
