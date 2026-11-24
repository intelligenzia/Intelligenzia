import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { claimAddress } from '@/lib/workspace-sync';

/** Creates the member's @intelligenzia.fi address at the part they chose. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const local = typeof body.local === 'string' ? body.local : '';
  const locale = body.locale === 'en' ? 'en' : 'fi';

  try {
    const result = await claimAddress(session.user.id, local, locale);
    const status = {
      active: 200,
      requested: 200,
      invalid: 409,
      already_has: 409,
      not_member: 403,
      failed: 502,
    }[result.status];
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error('[workspace] claim failed:', error);
    return NextResponse.json({ status: 'failed' }, { status: 500 });
  }
}
