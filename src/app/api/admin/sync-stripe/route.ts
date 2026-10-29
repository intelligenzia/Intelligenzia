import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { backfillFromStripe } from '@/lib/membership-backfill';

// A full pass over Stripe can outlast the default function timeout.
export const maxDuration = 60;

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json(await backfillFromStripe());
  } catch (error) {
    console.error('Stripe sync failed:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
