// Daily Claude add-on upkeep: ends Claude for lapsed members, retries failed
// Google Workspace calls and deletes accounts past their grace period. The
// work itself lives in the Next.js app (src/lib/claude-sync.ts); this only
// calls it on a schedule.

export default async function claudeMaintenance(): Promise<Response> {
  const origin = process.env.URL;
  const secret = process.env.CLAUDE_MAINTENANCE_SECRET;
  if (!origin || !secret) {
    console.error('claude-maintenance: URL or CLAUDE_MAINTENANCE_SECRET is not set');
    return new Response('not configured', { status: 500 });
  }
  const res = await fetch(`${origin}/api/claude/maintenance`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  console.log(`claude-maintenance: ${res.status} ${body}`);
  return new Response(body, { status: res.status });
}

export const config = { schedule: '@daily' };
