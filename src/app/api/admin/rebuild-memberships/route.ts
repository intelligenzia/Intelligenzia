import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';

type CsvRow = {
  customer_id: string;
  created: string;
  name: string;
  description: string;
  email: string;
  net_volume: string;
  gross_volume: string;
  payment_count: string;
  refund_volume: string;
  dispute_losses: string;
  first_payment: string;
  last_payment: string;
  outstanding_balance: string;
};

function parseEuroAmount(value: string): number {
  // Convert "30,00" to 3000 cents
  const cleaned = value.replace(',', '.');
  return Math.round(parseFloat(cleaned) * 100);
}

function parseDate(dateStr: string): Date {
  // Parse "2023-03-15 05:57" format
  const [datePart, timePart] = dateStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Read CSV file
    const csvPath = join(process.cwd(), 'customer_spend.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');

    const records: CsvRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Filter out Guest entries
    const validRecords = records.filter(row => row.customer_id !== 'Guest');

    const results = {
      deletedMemberships: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Step 1: Delete all existing memberships
    const deleteResult = await prisma.membership.deleteMany({});
    results.deletedMemberships = deleteResult.count;

    // Current date for checking if membership is active (within 1 year of last payment)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    // Step 2: Process each CSV row
    for (const row of validRecords) {
      const email = row.email?.trim().toLowerCase();
      const name = row.name?.trim() || null;
      const stripeCustomerId = row.customer_id;

      if (!email) {
        results.skipped++;
        continue;
      }

      try {
        const firstPaymentDate = parseDate(row.first_payment);
        const lastPaymentDate = parseDate(row.last_payment);
        const netVolume = parseEuroAmount(row.net_volume);

        // Determine status: ACTIVE if last payment is within 1 year, otherwise EXPIRED
        const isActive = lastPaymentDate > oneYearAgo;
        const status = isActive ? 'ACTIVE' : 'EXPIRED';

        // Calculate period end (1 year from last payment)
        const currentPeriodEnd = new Date(lastPaymentDate);
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // Create membership for existing user
          await prisma.membership.create({
            data: {
              userId: existingUser.id,
              stripeCustomerId,
              status,
              type: 'FULL',
              amountPaid: netVolume,
              currentPeriodEnd,
              createdAt: firstPaymentDate,
            },
          });

          // Update user name and createdAt if needed
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: existingUser.name || name,
              createdAt: firstPaymentDate,
            },
          });

          results.updated++;
        } else {
          // Create new user with membership
          await prisma.user.create({
            data: {
              email,
              name,
              emailVerified: firstPaymentDate,
              createdAt: firstPaymentDate,
              membership: {
                create: {
                  stripeCustomerId,
                  status,
                  type: 'FULL',
                  amountPaid: netVolume,
                  currentPeriodEnd,
                  createdAt: firstPaymentDate,
                },
              },
            },
          });

          results.created++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${email}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Rebuild complete. Deleted: ${results.deletedMemberships}, Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`,
    });
  } catch (error) {
    console.error('Rebuild error:', error);
    return NextResponse.json(
      { error: 'Rebuild failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
