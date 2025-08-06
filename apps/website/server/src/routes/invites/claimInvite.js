"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackInviteClaim = trackInviteClaim;
const POINTS_FOR_INVITE = 10;
async function trackInviteClaim(prisma, inviteCode, telegramUserId, telegramUsername) {
    // Find the invite
    const invite = await prisma.inviteLink.findUnique({
        where: { code: inviteCode },
        include: { user: true }
    });
    if (!invite) {
        throw new Error('Invalid invite code');
    }
    // Check if this Telegram user has already claimed
    const existingClaim = await prisma.inviteClaim.findFirst({
        where: {
            inviteId: invite.id,
            telegramUserId: telegramUserId
        }
    });
    // Prevent duplicate claims
    if (existingClaim) {
        return;
    }
    // We'll use direct SQL for some operations due to schema differences
    // Begin transaction
    await prisma.$transaction(async (tx) => {
        try {
            // 1. Record the claim using raw SQL
            await tx.$executeRaw `
        INSERT INTO "InviteClaim" 
        ("id", "inviteId", "telegramUserId", "telegramUsername", "claimedAt")
        VALUES 
        (gen_random_uuid(), ${invite.id}, ${telegramUserId}, ${telegramUsername}, NOW())
      `;
            // 2. Update invite usage
            await tx.$executeRaw `
        UPDATE "InviteLink"
        SET 
          "usedCount" = COALESCE("usedCount", 0) + 1,
          "used" = TRUE
        WHERE "id" = ${invite.id}
      `;
            // 3. Award points to inviter
            await tx.user.update({
                where: { id: invite.userId },
                data: {
                    points: { increment: POINTS_FOR_INVITE }
                }
            });
            // 4. Create point history record with raw SQL if the metadata column is not recognized
            await tx.$executeRaw `
        INSERT INTO "PointHistory"
        ("userId", "points", "reason", "platform", "createdAt", "metadata")
        VALUES
        (
          ${invite.userId}, 
          ${POINTS_FOR_INVITE}, 
          'INVITE', 
          'TELEGRAM', 
          NOW(),
          '{"telegramUsername": "${telegramUsername || ''}", "telegramUserId": "${telegramUserId}"}'::jsonb
        )
      `;
        }
        catch (error) {
            console.error("Transaction failed:", error);
            throw error;
        }
    });
}
