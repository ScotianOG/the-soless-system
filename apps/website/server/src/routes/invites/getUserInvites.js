"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserInvites = getUserInvites;
async function getUserInvites(prisma, wallet) {
    const user = await prisma.user.findUnique({
        where: { wallet },
    });
    if (!user) {
        throw new Error("User not found");
    }
    // Use raw queries to handle schema differences
    const rawInvites = await prisma.$queryRaw `
    SELECT 
      i.id, 
      i.code, 
      i.used, 
      i."fullInviteLink",
      i."usedCount",
      i."createdAt",
      i."contestId",
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
    // Map database results to match Invite interface
    return rawInvites.map(invite => ({
        id: invite.id,
        code: invite.code,
        fullInviteLink: invite.fullInviteLink || `https://t.me/+${invite.code}`,
        userId: user.id,
        used: invite.used,
        usedCount: invite.usedCount || 0,
        createdAt: invite.createdAt || new Date(),
        contestId: invite.contestId,
        claimsCount: Number(invite.claims_count) || 0
    }));
}
