import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { runClaudeMaintenance } from '@/lib/claude-sync';
import { runWorkspaceMaintenance } from '@/lib/workspace-sync';

// Member benefits' daily upkeep (Claude renewals, @intelligenzia.fi
// addresses). Run once a day by the scheduled function in netlify/functions. Guarded by
// CLAUDE_MAINTENANCE_SECRET, which the function sends as a bearer token.

function authorized(req: NextRequest): boolean {
  const secret = process.env.CLAUDE_MAINTENANCE_SECRET;
  const given = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!secret || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const result = {
      claude: await runClaudeMaintenance(),
      workspace: await runWorkspaceMaintenance(),
    };
    console.log('[benefits] maintenance:', JSON.stringify(result));
    return NextResponse.json(result);
  } catch (error) {
    console.error('[benefits] maintenance failed:', error);
    return NextResponse.json({ error: 'maintenance_failed' }, { status: 500 });
  }
}
