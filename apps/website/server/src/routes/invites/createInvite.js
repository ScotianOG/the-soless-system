"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvite = createInvite;
async function createInvite(prisma, wallet) {
    // Find current active contest
    const currentContest = await prisma.contest.findFirst({
        where: { status: 'ACTIVE' }
    });
    // Find user with existing invite for this contest
    const user = await prisma.user.findUnique({
        where: { wallet },
        include: {
            telegramAccount: true,
        }
    });
    // Require Telegram account
    if (!user || !user.telegramAccount) {
        throw new Error('Telegram account must be linked first');
    }
    // Check for existing invites - avoiding dynamic SQL that was causing errors
    let existingInvites;
    if (currentContest) {
        existingInvites = await prisma.$queryRaw `
      SELECT * FROM "InviteLink" 
      WHERE "userId" = ${user.id} 
      AND "used" = false
      AND "contestId" = ${currentContest.id}
      LIMIT 1
    `;
    }
    else {
        existingInvites = await prisma.$queryRaw `
      SELECT * FROM "InviteLink" 
      WHERE "userId" = ${user.id} 
      AND "used" = false
      LIMIT 1
    `;
    }
    // Return existing invite if one exists
    if (existingInvites.length > 0) {
        return { inviteLink: existingInvites[0].fullInviteLink || `https://t.me/+${existingInvites[0].code}` };
    }
    // Create new Telegram invite link
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const botResponse = await fetch(`https://api.telegram.org/bot${botToken}/createChatInviteLink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            name: `Invite by ${user.telegramUsername || "Unknown"}`,
            // Optional: set invite link to expire in 7 days
            expire_date: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
        })
    });
    const inviteData = await botResponse.json();
    if (!inviteData.ok) {
        throw new Error('Failed to create Telegram invite link');
    }
    const inviteLink = inviteData.result.invite_link;
    const code = inviteLink.split('/').pop();
    // Store invite link with all the needed fields
    const createdInvite = await prisma.inviteLink.create({
        data: {
            code,
            fullInviteLink: inviteLink,
            used: false,
            userId: user.id,
            contestId: currentContest?.id || null,
            usedCount: 0
        }
    });
    return { inviteLink };
}
