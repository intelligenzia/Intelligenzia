import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { backfillFromStripe } from '@/lib/membership-backfill';

// A full pass over Stripe can outlast the default function timeout.
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dryRun = new URL(req.url).searchParams.get('dryRun') === '1';
    return NextResponse.json(await backfillFromStripe({ dryRun }));
  } catch (error) {
    console.error('Stripe sync failed:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
