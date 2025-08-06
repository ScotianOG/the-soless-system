import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export async function getUser(req: Request, res: Response) {
  const { walletAddress } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { wallet: walletAddress },
      include: {
        telegramAccount: true,
        discordAccount: true,
        twitterAccount: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Build the platforms object with verification status
    const platforms: Record<
      string,
      { username: string; verified: boolean; lastVerified?: string }
    > = {};

    if (user.telegramAccount) {
      platforms.telegram = {
        username: user.telegramAccount.username || user.telegramUsername || "",
        verified: true, // If account exists, it's verified
        lastVerified: user.telegramAccount.createdAt?.toISOString(),
      };
    }

    if (user.discordAccount) {
      platforms.discord = {
        username: user.discordAccount.username || user.discordUsername || "",
        verified: true, // If account exists, it's verified
        lastVerified: user.discordAccount.createdAt?.toISOString(),
      };
    }

    if (user.twitterAccount) {
      platforms.twitter = {
        username: user.twitterAccount.username || user.twitterUsername || "",
        verified: true, // If account exists, it's verified
        lastVerified: user.twitterAccount.createdAt?.toISOString(),
      };
    }

    const profile = {
      wallet: user.wallet,
      username:
        user.telegramUsername ||
        user.discordUsername ||
        user.twitterUsername ||
        undefined,
      platforms,
    };

    res.json(profile);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
