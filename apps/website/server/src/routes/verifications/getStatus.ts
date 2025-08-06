// src/routes/verifications/getStatus.ts
import { PrismaClient } from "@prisma/client";
import { VerificationStatus } from "./types";

export async function getVerificationStatus(
  prisma: PrismaClient,
  wallet: string
): Promise<VerificationStatus> {
  const user = await prisma.user.findUnique({
    where: { wallet },
    include: {
      telegramAccount: true,
      discordAccount: true,
      twitterAccount: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    telegram: !!user.telegramAccount,
    discord: !!user.discordAccount,
    twitter: !!user.twitterAccount,
    accounts: {
      telegram: user.telegramAccount,
      discord: user.discordAccount,
      twitter: user.twitterAccount,
    },
  };
}
