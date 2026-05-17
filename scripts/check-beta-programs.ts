import 'dotenv/config';
import { prisma } from '../db/prisma';

async function main() {
  const programs = await prisma.betaProgram.findMany();
  console.table(
    programs.map((p) => ({
      code: p.code,
      audience: p.audience,
      tier: p.tier,
      redeemed: `${p.redeemedCount}/${p.maxRedemptions}`,
      freeMonths: p.freeMonths,
      postFreeDiscount: `${p.postFreeDiscountPercent}% × ${p.postFreeDiscountMonths}mo`,
      expires: p.expiresAt?.toISOString().slice(0, 10) ?? 'never',
      active: p.isActive,
    }))
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
