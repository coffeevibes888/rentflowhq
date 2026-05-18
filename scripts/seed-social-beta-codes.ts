/**
 * Seed social-channel beta codes.
 *
 * Run once to create per-channel codes that can be shared on TikTok, Reddit,
 * Facebook, and YouTube. Each channel gets two codes — one for PMs, one for
 * contractors — so the same launch post links the right audience.
 *
 * The link format is:
 *   https://propertyflowhq.com/sign-up?code=TIKTOK-PM
 *   https://propertyflowhq.com/sign-up?code=TIKTOK-CONTRACTOR
 *
 * Each program:
 *   - 100 redemption slots (raise/lower in admin → /admin/beta-testers)
 *   - 2 months free Enterprise
 *   - Then 35% off for 24 months
 *   - No expiry — use admin UI to deactivate when the launch window ends
 *
 * Usage:
 *   npx tsx scripts/seed-social-beta-codes.ts
 */

import { prisma } from '../db/prisma';

const SOCIAL_CHANNELS = ['TIKTOK', 'REDDIT', 'FACEBOOK', 'YOUTUBE'] as const;
const AUDIENCES: Array<'pm' | 'contractor'> = ['pm', 'contractor'];

async function main() {
  console.log('Seeding social beta codes...\n');

  for (const channel of SOCIAL_CHANNELS) {
    for (const audience of AUDIENCES) {
      // Code format: CHANNEL-AUDIENCE (e.g. TIKTOK-PM, REDDIT-CONTRACTOR)
      const code = `${channel}-${audience.toUpperCase()}`;

      const existing = await prisma.betaProgram.findUnique({ where: { code } });
      if (existing) {
        console.log(`  ↳ ${code.padEnd(22)} already exists (${existing.redeemedCount}/${existing.maxRedemptions} redeemed) — skipped`);
        continue;
      }

      const program = await prisma.betaProgram.create({
        data: {
          code,
          audience,
          tier: 'enterprise',
          maxRedemptions: 100,
          freeMonths: 2,
          postFreeDiscountPercent: 35,
          postFreeDiscountMonths: 24,
          isActive: true,
          // No expiry — deactivate from admin when ready.
        },
      });
      console.log(`  ✓ ${code.padEnd(22)} created · ${program.maxRedemptions} spots · ${program.freeMonths}mo free + ${program.postFreeDiscountPercent}% off ${program.postFreeDiscountMonths}mo`);
    }
  }

  console.log('\nShareable links:');
  for (const channel of SOCIAL_CHANNELS) {
    for (const audience of AUDIENCES) {
      const code = `${channel}-${audience.toUpperCase()}`;
      console.log(`  https://propertyflowhq.com/sign-up?code=${code}`);
    }
  }
  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
