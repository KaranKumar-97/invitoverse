import { prisma } from "@/server/db/prisma";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "RevokedGuestToken", "Guest", "MediaAsset", "Invitation", "Entitlement", "Session", "Account", "User" CASCADE',
  );
}

let n = 0;
export async function makeUser(name = "Owner") {
  n += 1;
  return prisma.user.create({
    data: { email: `${name.toLowerCase()}-${Date.now()}-${n}@test.local`, name },
  });
}
