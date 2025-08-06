// @ts-nocheck
// src/routes/invites/index.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createInvite } from "./createInvite";
import { trackInviteClaim } from "./claimInvite";
import { authenticateUser } from "../../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Create a new invite link
router.post("/create", authenticateUser, async (req, res) => {
  try {
    const { wallet } = req.body;

    // Verify the authenticated user matches the requested wallet
    if (!req.user || req.user.wallet !== wallet) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized to create invite for this wallet",
      });
    }

    const result = await createInvite(prisma, wallet);

    res.json({
      success: true,
      inviteLink: result.inviteLink,
    });
  } catch (error) {
    console.error("Failed to create invite:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get user invites
router.get("/user/:wallet", authenticateUser, async (req, res) => {
  try {
    const { wallet } = req.params;

    // Verify the authenticated user matches the requested wallet
    if (!req.user || req.user.wallet !== wallet) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized to view invites for this wallet",
      });
    }

    const user = await prisma.user.findUnique({
      where: { wallet },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Use raw queries to handle schema differences
    const rawInvites = await prisma.$queryRaw`
      SELECT 
        i.id, 
        i.code, 
        i.used, 
        i."fullInviteLink",
        i."usedCount",
        i."createdAt",
        COALESCE(c.claim_count, 0)::integer as claims_count
      FROM 
        "InviteLink" i
      LEFT JOIN (
        SELECT 
          "inviteId", 
          COUNT(*) as claim_count 
        FROM 
          "InviteClaim" 
        GROUP BY 
          "inviteId"
      ) c ON i.id = c."inviteId"
      WHERE 
        i."userId" = ${user.id}
      ORDER BY 
        i.used ASC,
        i."createdAt" DESC
    `;

    res.json({
      success: true,
      invites: rawInvites.map((invite) => ({
        id: invite.id,
        code: invite.code,
        fullInviteLink:
          invite.fullInviteLink || `https://t.me/+${invite.code}`,
        usedCount: invite.usedCount || (invite.used ? 1 : 0),
        createdAt: invite.createdAt || new Date(),
        claimsCount: Number(invite.claims_count) || 0,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch user invites:", error);
    res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
});

// Process an invite claim (from Telegram bot)
router.post("/claim", async (req, res) => {
  try {
    const { inviteCode, telegramUserId, telegramUsername } = req.body;

    await trackInviteClaim(
      prisma,
      inviteCode,
      telegramUserId,
      telegramUsername
    );

    res.json({
      success: true,
      message: "Invite claimed successfully",
    });
  } catch (error) {
    console.error("Failed to claim invite:", error);
    res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
});

export const inviteRouter = router;
