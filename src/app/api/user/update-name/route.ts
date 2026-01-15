import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      return NextResponse.json({ error: 'Name too long' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: trimmedName },
    });

    return NextResponse.json({ success: true, name: trimmedName });
  } catch (error) {
    console.error('Update name error:', error);
    return NextResponse.json({ error: 'Failed to update name' }, { status: 500 });
  }
}
