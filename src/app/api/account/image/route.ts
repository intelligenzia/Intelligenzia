import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// The signed-in member's profile picture. The browser crops and shrinks it
// before upload (components/profile-image.tsx), so it is small enough to
// keep in the database. Only the member themself can see it for now.

const MAX_BYTES = 512 * 1024;

/** Real image files only, recognised by their first bytes, not the header. */
function sniff(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });
  const image = await prisma.profileImage.findUnique({ where: { userId: session.user.id } });
  if (!image) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(image.data), {
    headers: {
      'Content-Type': image.mimeType,
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 });
  }
  const mimeType = sniff(bytes);
  if (!mimeType) return NextResponse.json({ error: 'not_an_image' }, { status: 415 });

  const userId = session.user.id;
  const saved = await prisma.profileImage.upsert({
    where: { userId },
    create: { userId, mimeType, data: Buffer.from(bytes) },
    update: { mimeType, data: Buffer.from(bytes) },
  });
  // The version in the URL lets browsers cache each picture forever.
  const url = `/api/account/image?v=${saved.updatedAt.getTime()}`;
  await prisma.user.update({ where: { id: userId }, data: { image: url } });
  return NextResponse.json({ url });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await prisma.profileImage.deleteMany({ where: { userId: session.user.id } });
  await prisma.user.update({ where: { id: session.user.id }, data: { image: null } });
  return NextResponse.json({ ok: true });
}
