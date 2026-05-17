/**
 * Seed the two beta-tester programs:
 *   - BETAPM2026  for property managers / landlords
 *   - BETACON2026 for marketplace contractors
 *
 * Each is capped at 25 redemptions, gives 2 months free Enterprise, and
 * stamps a 35% discount for 24 months on the user's profile after that.
 *
 * Idempotent — safe to run multiple times. Only updates fields that haven't
 * been claimed (it never lowers `redeemedCount`).
 *
 * Usage: npx tsx scripts/seed-beta-programs.ts
 */
import 'dotenv/config';
import { prisma } from '../db/prisma';

const PROGRAM_EXPIRES_AT = new Date('2026-12-31T23:59:59Z');

async function upsertProgram(opts: {
  code: string;
  audience: 'pm' | 'contractor';
}) {
  const existing = await prisma.betaProgram.findUnique({
    where: { code: opts.code },
  });

  if (existing) {
    // Don't lower a count or break an active program — just keep settings fresh.
    const updated = await prisma.betaProgram.update({
      where: { code: opts.code },
      data: {
        isActive: true,
        tier: 'enterprise',
        maxRedemptions: 25,
        freeMonths: 2,
        postFreeDiscountPercent: 35,
        postFreeDiscountMonths: 24,
        expiresAt: PROGRAM_EXPIRES_AT,
      },
    });
    console.log(
      `↻ Updated ${updated.code} (${updated.audience}) — ${updated.redeemedCount}/${updated.maxRedemptions} redeemed`
    );
    return updated;
  }

  const created = await prisma.betaProgram.create({
    data: {
      code: opts.code,
      audience: opts.audience,
      tier: 'enterprise',
      maxRedemptions: 25,
      redeemedCount: 0,
      freeMonths: 2,
      postFreeDiscountPercent: 35,
      postFreeDiscountMonths: 24,
      expiresAt: PROGRAM_EXPIRES_AT,
      isActive: true,
    },
  });
  console.log(`✅ Created ${created.code} (${created.audience}) — 0/${created.maxRedemptions} redeemed`);
  return created;
}

async function main() {
  console.log('🌱 Seeding beta programs...\n');
  await upsertProgram({ code: 'BETAPM2026', audience: 'pm' });
  await upsertProgram({ code: 'BETACON2026', audience: 'contractor' });
  console.log('\n🎉 Done.');
}

main()
  .catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
