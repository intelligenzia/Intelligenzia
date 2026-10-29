import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { exportAccount } from '@/lib/account';

/** The signed-in member's own data as a JSON download (GDPR art. 15, 20). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await exportAccount(session.user.id);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="intelligenzia-tiedot-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
