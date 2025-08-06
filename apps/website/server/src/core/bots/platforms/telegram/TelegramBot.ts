// src/core/bots/platforms/telegram/TelegramBot.ts
import { Bot, Context, RawApi } from "grammy";
import { BasePlatformBot, BaseBotConfig } from "../BasePlatformBot";
import { PrismaClient, EngagementType } from "@prisma/client";
import YouTubeService from "../../../../utils/youtube";
import { SOLESS_FACTS, FACT_CONFIG } from "../../../../config/facts";
import axios from "axios";
import { trackInviteClaim } from "../../../../routes/invites/claimInvite";

const prisma = new PrismaClient();

// Extend the base Context type from grammy
type BotContext = Context & {
  api: RawApi;
};

export class TelegramBot extends BasePlatformBot {
  private bot: Bot;
  private youtubeService: YouTubeService;
  private debug: boolean;
  private isRunning: boolean = false;
  private userCooldowns: Map<string, Record<string, number>> = new Map();

  // AI integration properties
  private conversations: Map<string, string> = new Map(); // chatId -> conversationId
  private aiApiUrl: string;

  constructor(config: BaseBotConfig) {
    super(config);
    this.debug = process.env.NODE_ENV !== "production";

    // Debug token loading
    console.log("TelegramBot token debug:", {
      configToken: config.token
        ? `${config.token.substring(0, 10)}...`
        : "NOT_SET",
      envToken: process.env.TELEGRAM_BOT_TOKEN
        ? `${process.env.TELEGRAM_BOT_TOKEN.substring(0, 10)}...`
        : "NOT_SET",
      actualToken: this.token ? `${this.token.substring(0, 10)}...` : "NOT_SET",
    });

    this.bot = new Bot(this.token);
    this.youtubeService = new YouTubeService(process.env.YOUTUBE_API_KEY || "");
    this.aiApiUrl = process.env.AI_API_URL || "http://localhost:3000/api";
    this.setupHandlers();
  }

  private setupHandlers() {
    // Debug handler
    if (this.debug) {
      this.bot.command("ping", async (ctx) => {
        await ctx.reply("pong");
      });
    }

    // Add test command to verify bot is working
    this.bot.command("test", async (ctx) => {
      console.log(
        "Test command received from:",
        ctx.from?.id,
        ctx.from?.username
      );
      await ctx.reply("✅ Bot is working! Commands are being received.");
    });

    // Help command
    this.bot.command("help", async (ctx) => {
      await ctx.reply(`🎵 SOLess Community Bot Commands 🎵

🤖 AI Assistant:
- /soulie [question] - Ask me anything about SOLess
- /eli5 - Switch to simple explanations for kids
- /normal - Switch back to normal explanations

🎶 Music Commands:
- /soulieplay [song] - Share music and earn points (5 pts, max 10/day)

📚 Information Commands:
- /solfact - Share a random SOLess fact (2 pts, max 3/day)

📊 Stats & Rankings:
- /points - Check your points and stats
- /leaderboard - View top community members

🔗 Account Management:
- /verify [code] - Link your wallet with Telegram

💬 Natural Chat:
- Just mention @${(await this.bot.api.getMe()).username} or "Soulie" in groups
- In DMs, just type normally and I'll respond!

Need more help? Visit our website or ask in the community!`);
    });

    // Verify command
    this.bot.command("verify", async (ctx) => {
      try {
        const text = ctx.message?.text || "";
        const parts = text.split(" ");
        const code = parts.length > 1 ? parts[1].trim().toUpperCase() : "";

        if (!code) {
          await ctx.reply(
            "Please provide your verification code:\n" +
              "/verify YOUR_CODE\n\n" +
              "Don't have a code? Visit https://soless.app/register to connect your wallet and generate one, then come back to @Soulie_bot to verify."
          );
          return;
        }

        if (!ctx.from?.id) {
          await ctx.reply("Could not identify user.");
          return;
        }

        const verification = await prisma.verificationCode.findUnique({
          where: { code },
          include: { user: true },
        });

        if (
          !verification ||
          verification.isUsed ||
          new Date() > verification.expiresAt
        ) {
          await ctx.reply("❌ Invalid or expired code. Please try again.");
          return;
        }

        // Check if this telegram account is already linked
        const existingAccount = await prisma.telegramAccount.findUnique({
          where: { platformId: ctx.from.id.toString() },
        });

        if (existingAccount) {
          await ctx.reply(
            "This Telegram account is already linked to a wallet."
          );
          return;
        }

        await prisma.$transaction([
          // Mark code as used
          prisma.verificationCode.update({
            where: { id: verification.id },
            data: { isUsed: true },
          }),

          // Update user record with Telegram username
          prisma.user.update({
            where: { id: verification.user.id },
            data: { telegramUsername: ctx.from.username || undefined },
          }),

          // Create Telegram account link
          prisma.telegramAccount.create({
            data: {
              userId: verification.user.id,
              platformId: ctx.from.id.toString(),
              username: ctx.from.username || undefined,
            },
          }),
        ]);

        await ctx.reply(
          "✅ Account verified! Welcome to SOLess community! You can now start earning points."
        );

        // Award initial points for verification
        await prisma.$transaction([
          prisma.pointTransaction.create({
            data: {
              userId: verification.user.id,
              amount: 5,
              reason: "COMMAND",
              platform: "TELEGRAM",
              metadata: { command: "verify" },
            },
          }),
          prisma.user.update({
            where: { id: verification.user.id },
            data: {
              points: { increment: 5 },
              lifetimePoints: { increment: 5 },
            },
          }),
        ]);
      } catch (error) {
        console.error("Verification error:", error);
        await ctx.reply("An error occurred. Please try again later.");
      }
    });

    // AI Chat commands
    this.bot.command("soulie", async (ctx) => {
      try {
        const text = ctx.message?.text || "";
        const question = text.replace("/soulie", "").trim();

        if (!question) {
          await ctx.reply(
            "🤖 Hello! I'm Soulie, your AI assistant.\n\n" +
              "Ask me anything about SOLess!\n\n" +
              "Example: /soulie What is SOLess?"
          );
          return;
        }

        await this.handleAIChat(ctx, question);
      } catch (error) {
        console.error("Error in soulie command:", error);
        await ctx.reply(
          "Sorry, I couldn't process your question. Please try again later."
        );
      }
    });

    this.bot.command("eli5", async (ctx) => {
      const eli5Message = `🧸 *Explain Like I'm 5 Mode Activated!*

I'll now explain things in super simple terms like you're 5 years old!

Just ask me your question after this message, and I'll respond with a child-friendly explanation.

You can turn off this mode by typing /normal`;

      // Store ELI5 mode in conversation metadata
      const chatId = ctx.chat?.id.toString();
      if (chatId) {
        const conversationId = await this.getOrCreateConversation(chatId);
        try {
          await axios.post(
            `${this.aiApiUrl}/conversations/${conversationId}/metadata`,
            {
              key: "eli5Mode",
              value: true,
            }
          );
        } catch (error) {
          console.error(
            "Error setting ELI5 mode:",
            error instanceof Error ? error.message : error
          );
        }
      }

      await ctx.reply(eli5Message, { parse_mode: "Markdown" });
    });

    this.bot.command("normal", async (ctx) => {
      const normalMessage = `👨‍💻 *Normal Mode Activated!*

I'll now explain things normally again.`;

      // Turn off ELI5 mode in conversation metadata
      const chatId = ctx.chat?.id.toString();
      if (chatId) {
        const conversationId = await this.getOrCreateConversation(chatId);
        try {
          await axios.post(
            `${this.aiApiUrl}/conversations/${conversationId}/metadata`,
            {
              key: "eli5Mode",
              value: false,
            }
          );
        } catch (error) {
          console.error(
            "Error setting normal mode:",
            error instanceof Error ? error.message : error
          );
        }
      }

      await ctx.reply(normalMessage, { parse_mode: "Markdown" });
    });

    // Points command
    this.bot.command("points", async (ctx) => {
      try {
        if (!ctx.from?.id) {
          await ctx.reply("Could not identify your account.");
          return;
        }

        const telegramAccount = await prisma.telegramAccount.findUnique({
          where: { platformId: ctx.from.id.toString() },
          include: { user: true },
        });

        if (!telegramAccount) {
          await ctx.reply(
            "Your account is not linked yet.\n" +
              "Please visit https://soless.app/register to connect your wallet and verify your account with @Soulie_bot."
          );
          return;
        }

        const user = telegramAccount.user;

        // Get rank
        const higherRanked = await prisma.user.count({
          where: { points: { gt: user.points } },
        });

        // Get streak
        const streak = await prisma.userStreak.findUnique({
          where: { userId: user.id },
        });

        // Get today's points
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayPoints = await prisma.pointTransaction.aggregate({
          where: {
            userId: user.id,
            timestamp: { gte: today },
          },
          _sum: { amount: true },
        });

        // Get recent activity
        const recentActivity = await prisma.pointTransaction.findMany({
          where: { userId: user.id },
          orderBy: { timestamp: "desc" },
          take: 5,
        });

        const activityTypes = {
          MUSIC_SHARE: "Music sharing",
          MESSAGE: "Regular message",
          QUALITY_POST: "Quality post",
          MENTION: "Mentioning others",
          COMMAND: "Command used",
          STREAK_BONUS: "Streak bonus",
          TEACHING_POST: "Teaching post",
          FACT_SHARE: "SOLess fact",
          AI_CHAT: "AI conversation",
        };

        const message = [
          "🏆 Your SOLess Stats 🏆",
          "",
          `Total Points: ${user.points}`,
          `Global Rank: #${higherRanked + 1}`,
          "",
          "📱 Telegram Activity",
          `• Current Streak: ${streak?.telegramStreak || 0} days`,
          `• Points Today: ${todayPoints._sum.amount || 0}`,
          "",
          "💫 Recent Activity",
        ];

        if (recentActivity.length > 0) {
          recentActivity.forEach((activity) => {
            const type =
              activityTypes[activity.reason as keyof typeof activityTypes] ||
              activity.reason;
            message.push(`• ${type} (+${activity.amount})`);
          });
        } else {
          message.push("• No recent activity");
        }

        await ctx.reply(message.join("\n"));
      } catch (error) {
        console.error("Error fetching points:", error);
        await ctx.reply("An error occurred. Please try again later.");
      }
    });

    // Leaderboard command
    this.bot.command("leaderboard", async (ctx) => {
      try {
        // Get top users by points
        const leaders = await prisma.user.findMany({
          where: {
            telegramUsername: { not: null },
          },
          orderBy: { points: "desc" },
          take: 10,
        });

        if (leaders.length === 0) {
          await ctx.reply("No users on the leaderboard yet.");
          return;
        }

        const message = ["🏆 SOLess Community Leaderboard 🏆", ""];

        leaders.forEach((user, index) => {
          message.push(
            `${index + 1}. @${user.telegramUsername || "Anonymous"}: ${
              user.points
            } points`
          );
        });

        await ctx.reply(message.join("\n"));
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        await ctx.reply("An error occurred. Please try again later.");
      }
    });

    // Solfact command
    this.bot.command("solfact", async (ctx) => {
      try {
        if (!ctx.from?.id) {
          await ctx.reply("Could not identify your account.");
          return;
        }

        const telegramId = ctx.from.id.toString();

        // Find user
        const telegramAccount = await prisma.telegramAccount.findUnique({
          where: { platformId: telegramId },
          include: { user: true },
        });

        if (!telegramAccount) {
          await ctx.reply(
            "Your account is not linked yet.\n" +
              "Please visit https://soless.app/register to connect your wallet and verify your account with @Soulie_bot."
          );
          return;
        }

        const userId = telegramAccount.userId;

        // Check cooldown
        const cooldownKey = `${userId}_FACT_SHARE`;
        const now = Date.now();
        const cooldowns = this.userCooldowns.get(userId) || {};

        if (cooldowns[cooldownKey] && now < cooldowns[cooldownKey]) {
          const remainingTime = Math.ceil(
            (cooldowns[cooldownKey] - now) / 1000 / 60
          );
          await ctx.reply(
            `Please wait ${remainingTime} minutes before sharing another SOLess fact.`
          );
          return;
        }

        // Check daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyFacts = await prisma.pointTransaction.count({
          where: {
            userId,
            reason: "FACT_SHARE",
            timestamp: { gte: today },
          },
        });

        if (dailyFacts >= FACT_CONFIG.dailyLimit) {
          await ctx.reply(
            `You've reached the daily limit of ${FACT_CONFIG.dailyLimit} SOLess facts. Try again tomorrow!`
          );
          return;
        }

        // Select random fact
        const randomFact =
          SOLESS_FACTS[Math.floor(Math.random() * SOLESS_FACTS.length)];

        // Award points
        await prisma.$transaction([
          prisma.pointTransaction.create({
            data: {
              userId,
              amount: FACT_CONFIG.points,
              reason: "FACT_SHARE",
              platform: "TELEGRAM",
              metadata: { fact: randomFact },
            },
          }),
          prisma.user.update({
            where: { id: userId },
            data: {
              points: { increment: FACT_CONFIG.points },
              lifetimePoints: { increment: FACT_CONFIG.points },
            },
          }),
        ]);

        // Set cooldown
        this.userCooldowns.set(userId, {
          ...cooldowns,
          [cooldownKey]: now + FACT_CONFIG.cooldown * 1000,
        });

        await ctx.reply(
          `🧠 SOLess Fact #${dailyFacts + 1}/${FACT_CONFIG.dailyLimit}:\n\n` +
            `"${randomFact}"\n\n` +
            `+${FACT_CONFIG.points} points awarded!`
        );
      } catch (error) {
        console.error("Error sharing SOLess fact:", error);
        await ctx.reply("An error occurred. Please try again later.");
      }
    });

    // Handle soulieplay
    this.bot.command("soulieplay", async (ctx) => {
      try {
        if (!ctx.from?.id || !ctx.chat?.id) return;

        const text = ctx.message?.text || "";
        const parts = text.split(" ");
        const songQuery = parts.slice(1).join(" ").trim();

        if (!songQuery) {
          await ctx.reply(
            "Please provide a song to share. Example: /soulieplay Daft Punk - Get Lucky"
          );
          return;
        }

        // Find user
        const telegramId = ctx.from.id.toString();
        const telegramAccount = await prisma.telegramAccount.findUnique({
          where: { platformId: telegramId },
          include: { user: true },
        });

        // Check if user is a new member who needs to be unrestricted
        const chatMember = await ctx.api.getChatMember(
          ctx.chat.id,
          ctx.from.id
        );

        if (chatMember.status === "restricted") {
          await ctx.api.restrictChatMember(ctx.chat.id, ctx.from.id, {
            can_send_messages: true,
            can_send_other_messages: true,
            can_add_web_page_previews: true,
            can_invite_users: true,
          });

          // Even unverified users can be unrestricted with soulieplay
          await ctx.reply(
            `Chat privileges unlocked! 🎉\n\nYou can now participate in the community. Connect your wallet at https://soless.app/register to start earning points.`
          );

          // Search for the song and share it
          try {
            const video = await this.youtubeService.searchVideo(songQuery);
            if (video) {
              await ctx.reply(`You shared: ${video.title}\n${video.url}`);
            } else {
              await ctx.reply("Sorry, I couldn't find that song on YouTube.");
            }
          } catch (error) {
            console.error("YouTube search error:", error);
            await ctx.reply(
              "Error searching for your song. Please try again later."
            );
          }

          return;
        }

        // For verified users, track points
        if (!telegramAccount) {
          await ctx.reply(
            `To start earning points with music sharing, connect your wallet at https://soless.app/register`
          );

          // Still search and share the song for non-verified users
          try {
            const video = await this.youtubeService.searchVideo(songQuery);
            if (video) {
              await ctx.reply(`You shared: ${video.title}\n${video.url}`);
            } else {
              await ctx.reply("Sorry, I couldn't find that song on YouTube.");
            }
          } catch (error) {
            console.error("YouTube search error:", error);
            await ctx.reply(
              "Error searching for your song. Please try again later."
            );
          }

          return;
        }

        const userId = telegramAccount.userId;

        // Check cooldown
        const cooldownKey = `${userId}_MUSIC_SHARE`;
        const now = Date.now();
        const cooldowns = this.userCooldowns.get(userId) || {};

        if (cooldowns[cooldownKey] && now < cooldowns[cooldownKey]) {
          const remainingTime = Math.ceil(
            (cooldowns[cooldownKey] - now) / 1000 / 60
          );
          await ctx.reply(
            `Please wait ${remainingTime} minutes before sharing another song.`
          );
          return;
        }

        // Check daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyShares = await prisma.pointTransaction.count({
          where: {
            userId,
            reason: "MUSIC_SHARE",
            timestamp: { gte: today },
          },
        });

        if (dailyShares >= 10) {
          await ctx.reply(
            "You've reached the daily limit for music shares. Try again tomorrow!"
          );
          return;
        }

        // Search for the song
        const video = await this.youtubeService.searchVideo(songQuery);
        if (!video) {
          await ctx.reply(
            "Sorry, I couldn't find that song on YouTube. Please try a different query."
          );
          return;
        }

        // Award points
        await prisma.$transaction([
          prisma.pointTransaction.create({
            data: {
              userId,
              amount: 5,
              reason: "MUSIC_SHARE",
              platform: "TELEGRAM",
              metadata: { song: video.title, url: video.url },
            },
          }),
          prisma.user.update({
            where: { id: userId },
            data: {
              points: { increment: 5 },
              lifetimePoints: { increment: 5 },
            },
          }),
        ]);

        // Set cooldown (5 minutes)
        this.userCooldowns.set(userId, {
          ...cooldowns,
          [cooldownKey]: now + 5 * 60 * 1000,
        });

        await ctx.reply(
          `🎵 Thanks for sharing music!\n\nYou shared: ${video.title}\n${
            video.url
          }\n\n+5 points awarded! (${dailyShares + 1}/10 shares today)`
        );
      } catch (error) {
        console.error("Soulieplay error:", error);
        await ctx.reply("An error occurred. Please try again later.");
      }
    });

    // Consolidated message handler for both AI and point tracking
    this.bot.on("message", async (ctx) => {
      console.log("Message received:", {
        text: ctx.message?.text?.substring(0, 50),
        from: ctx.from?.id,
        username: ctx.from?.username,
        chat: ctx.chat?.id,
        type: ctx.chat?.type,
      });

      // Skip command messages
      if (ctx.message?.text?.startsWith("/")) {
        console.log("Skipping command message");
        return;
      }

      try {
        const messageText = ctx.message?.text || "";
        if (!messageText) return;

        const telegramId = ctx.from?.id?.toString();
        if (!telegramId) return;

        const isGroup =
          ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
        const chatId = ctx.chat?.id.toString();

        // Handle AI chat logic first
        if (isGroup) {
          // In groups, only respond to mentions or replies to bot
          const botInfo = await this.bot.api.getMe();
          const botUsername = botInfo.username;

          // Check for bot mentions
          const isMentionedWithAt = messageText
            .toLowerCase()
            .includes(`@${botUsername.toLowerCase()}`);
          const isMentionedBySoulie = messageText
            .toLowerCase()
            .includes("soulie");
          const isReplyToBot =
            ctx.message?.reply_to_message?.from?.id === botInfo.id;

          if (isMentionedWithAt || isMentionedBySoulie || isReplyToBot) {
            // Clean up the message by removing bot mentions
            let cleanMessage = messageText;
            if (isMentionedWithAt) {
              cleanMessage = cleanMessage
                .replace(new RegExp(`@${botUsername}`, "i"), "")
                .trim();
            }
            if (isMentionedBySoulie) {
              cleanMessage = cleanMessage.replace(/soulie/i, "").trim();
            }

            if (cleanMessage) {
              await this.handleAIChat(ctx, cleanMessage);
            }
          }
        } else {
          // In DMs, respond to all non-command messages
          // Check for ELI5 keywords
          const hasEli5Keyword =
            /explain\s+like\s+(i['']?m|i\s+am|to)\s+(a\s+)?5(\s+year\s+old)?/i.test(
              messageText
            ) || /eli5/i.test(messageText);

          let processedMessage = messageText;

          if (hasEli5Keyword) {
            // Remove the ELI5 trigger and set temporary ELI5 mode
            processedMessage = messageText
              .replace(
                /explain\s+like\s+(i['']?m|i\s+am|to)\s+(a\s+)?5(\s+year\s+old)?/i,
                ""
              )
              .replace(/eli5/i, "")
              .trim();

            if (!processedMessage) {
              await ctx.reply(
                "What would you like me to explain in simple terms?"
              );
              return;
            }

            // Set temporary ELI5 mode
            const conversationId = await this.getOrCreateConversation(chatId!);
            try {
              await axios.post(
                `${this.aiApiUrl}/conversations/${conversationId}/metadata`,
                {
                  key: "eli5Mode",
                  value: true,
                }
              );

              // Reset to normal mode after this message
              setTimeout(async () => {
                try {
                  await axios.post(
                    `${this.aiApiUrl}/conversations/${conversationId}/metadata`,
                    {
                      key: "eli5Mode",
                      value: false,
                    }
                  );
                } catch (error) {
                  console.error(
                    "Error resetting ELI5 mode:",
                    error instanceof Error ? error.message : error
                  );
                }
              }, 1000);
            } catch (error) {
              console.error(
                "Error setting one-time ELI5 mode:",
                error instanceof Error ? error.message : error
              );
            }
          }

          await this.handleAIChat(ctx, processedMessage);
        }

        // Handle point tracking for verified users
        const telegramAccount = await prisma.telegramAccount.findUnique({
          where: { platformId: telegramId },
          include: { user: true },
        });

        if (!telegramAccount) return; // Not a verified user

        const userId = telegramAccount.userId;
        const now = Date.now();
        const cooldowns = this.userCooldowns.get(userId) || {};

        // Award points based on message content
        let totalPoints = 0;
        const pointReasons: Array<{ type: EngagementType; points: number }> =
          [];

        // Check for keyword mentions (1 point)
        const keywords = [
          "soless",
          "#soless",
          "@soless",
          "solarium",
          "solspace",
          "soulie",
          "soul",
          "nft",
          "swap",
        ];
        const hasKeyword = keywords.some((keyword) =>
          messageText.toLowerCase().includes(keyword)
        );

        if (hasKeyword) {
          // Check cooldown for keyword message (60 seconds)
          const messageKey = `${userId}_MESSAGE`;

          if (!cooldowns[messageKey] || now >= cooldowns[messageKey]) {
            // Can award keyword message point
            totalPoints += 1;
            pointReasons.push({ type: EngagementType.MESSAGE, points: 1 });

            // Set cooldown
            cooldowns[messageKey] = now + 60 * 1000; // 60 second cooldown
          }
        }

        // 2. Quality post check (additional 1 point for 10+ words)
        if (messageText.split(" ").length >= 10) {
          // Check cooldown for quality posts (5 minutes)
          const qualityKey = `${userId}_QUALITY_POST`;

          if (!cooldowns[qualityKey] || now >= cooldowns[qualityKey]) {
            // Can award quality post point
            totalPoints += 1;
            pointReasons.push({ type: EngagementType.QUALITY_POST, points: 1 });

            // Set cooldown
            cooldowns[qualityKey] = now + 5 * 60 * 1000; // 5 minute cooldown
          }
        }

        // 3. Mentions check (additional 1 point for @username)
        if (messageText.includes("@") && !messageText.includes("@soless")) {
          // Check cooldown for mentions (3 minutes)
          const mentionKey = `${userId}_MENTION`;

          if (!cooldowns[mentionKey] || now >= cooldowns[mentionKey]) {
            // Can award mention point
            totalPoints += 1;
            pointReasons.push({ type: EngagementType.MENTION, points: 1 });

            // Set cooldown
            cooldowns[mentionKey] = now + 3 * 60 * 1000; // 3 minute cooldown
          }
        }

        // 4. Teaching post check (additional 4 points for 35+ words)
        if (messageText.split(" ").length >= 35) {
          // Check cooldown for teaching posts (15 minutes)
          const teachingKey = `${userId}_TEACHING_POST`;

          if (!cooldowns[teachingKey] || now >= cooldowns[teachingKey]) {
            // Can award teaching post points
            totalPoints += 4;
            pointReasons.push({
              type: EngagementType.TEACHING_POST,
              points: 4,
            });

            // Set cooldown
            cooldowns[teachingKey] = now + 15 * 60 * 1000; // 15 minute cooldown
          }
        }

        // Update cooldowns
        this.userCooldowns.set(userId, cooldowns);

        // If any points were earned, record transactions
        if (totalPoints > 0) {
          // Check daily limit
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const dailyPoints = await prisma.pointTransaction.aggregate({
            where: {
              userId,
              timestamp: { gte: today },
            },
            _sum: { amount: true },
          });

          const currentDailyPoints = dailyPoints._sum.amount || 0;

          // Limit to 1000 points per day
          if (currentDailyPoints + totalPoints > 1000) {
            // Skip awarding points if over daily limit
            return;
          }

          // Create transactions for each reason
          await prisma.$transaction([
            ...pointReasons.map((reason) =>
              prisma.pointTransaction.create({
                data: {
                  userId,
                  amount: reason.points,
                  reason: reason.type,
                  platform: "TELEGRAM",
                  metadata: {
                    messageId: ctx.message?.message_id,
                    length: messageText.length,
                    wordCount: messageText.split(" ").length,
                  },
                },
              })
            ),
            // Update user's total points
            prisma.user.update({
              where: { id: userId },
              data: {
                points: { increment: totalPoints },
                lifetimePoints: { increment: totalPoints },
                lastActive: new Date(),
              },
            }),
          ]);

          // Update streak
          await this.updateUserStreak(userId);

          console.log(
            `Awarded ${totalPoints} points to user ${userId} for message`
          );
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    // Initialize AI message handling (integrated above)
    this.setupAIMessageHandler();

    // Handle new chat members for invite tracking
    this.bot.on("chat_member", async (ctx) => {
      try {
        if (ctx.chatMember.new_chat_member?.status === "member") {
          // Get the invite link directly from the context if available
          const inviteLink = ctx.chatMember.invite_link?.invite_link;
          const newMember = ctx.chatMember.new_chat_member.user;

          if (inviteLink && newMember) {
            // Extract code from invite link
            const code = inviteLink.split("/").pop();

            if (code) {
              // Call API to track invite claim
              await axios.post(
                `${
                  process.env.API_BASE_URL || "http://localhost:3001"
                }/invites/claim`,
                {
                  inviteCode: code,
                  telegramUserId: newMember.id.toString(),
                  telegramUsername: newMember.username,
                }
              );

              console.log(
                `Tracked invite claim from user ${newMember.id} using invite code ${code}`
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to track invite claim:", error);
      }
    });

    // Error handling
    this.bot.catch((err) => {
      console.error("Bot error:", err);
    });
  }

  // AI Integration Methods
  private async getOrCreateConversation(chatId: string): Promise<string> {
    let conversationId = this.conversations.get(chatId);
    if (!conversationId) {
      try {
        const response = await axios.post(`${this.aiApiUrl}/conversations`);
        conversationId = response.data.conversationId;
        if (conversationId) {
          this.conversations.set(chatId, conversationId);
        } else {
          throw new Error("No conversation ID returned");
        }
      } catch (error) {
        console.error(
          "Error creating conversation:",
          error instanceof Error ? error.message : error
        );
        throw error;
      }
    }
    return conversationId;
  }

  private async handleAIChat(ctx: any, message: string): Promise<void> {
    try {
      const chatId = ctx.chat?.id.toString();
      if (!chatId) return;

      // Show typing indicator
      await ctx.replyWithChatAction("typing");

      // Get or create conversation
      const conversationId = await this.getOrCreateConversation(chatId);

      // Send message to AI API
      const response = await axios.post(
        `${this.aiApiUrl}/conversations/${conversationId}/messages`,
        { message }
      );

      const { message: aiResponse } = response.data;

      // Send response using split message function
      await this.sendSplitMessage(ctx, aiResponse);

      // Award points for AI interaction (if user is verified)
      await this.awardAIPoints(ctx);

      console.log(`AI message processed for chat ${chatId}`);
    } catch (error) {
      console.error(
        "Error processing AI message:",
        error instanceof Error ? error.message : error
      );
      await ctx.reply(
        "Sorry, I couldn't process your message. Please try again later."
      );
    }
  }

  private async awardAIPoints(ctx: any): Promise<void> {
    try {
      const telegramId = ctx.from?.id?.toString();
      if (!telegramId) return;

      // Find user
      const telegramAccount = await prisma.telegramAccount.findUnique({
        where: { platformId: telegramId },
        include: { user: true },
      });

      if (!telegramAccount) return; // Not a verified user

      const userId = telegramAccount.userId;
      const now = Date.now();
      const cooldowns = this.userCooldowns.get(userId) || {};

      // Check cooldown for AI chat (2 minutes)
      const aiChatKey = `${userId}_AI_CHAT`;
      if (cooldowns[aiChatKey] && now < cooldowns[aiChatKey]) {
        return; // Still in cooldown
      }

      // Check daily limit for AI interactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyAIChats = await prisma.pointTransaction.count({
        where: {
          userId,
          reason: EngagementType.AI_CHAT,
          timestamp: { gte: today },
        },
      });

      if (dailyAIChats >= 5) {
        return; // Daily limit reached
      }

      // Award points
      await prisma.$transaction([
        prisma.pointTransaction.create({
          data: {
            userId,
            amount: 2,
            reason: EngagementType.AI_CHAT,
            platform: "TELEGRAM",
            metadata: { chatId: ctx.chat?.id },
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            points: { increment: 2 },
            lifetimePoints: { increment: 2 },
            lastActive: new Date(),
          },
        }),
      ]);

      // Set cooldown (2 minutes)
      this.userCooldowns.set(userId, {
        ...cooldowns,
        [aiChatKey]: now + 2 * 60 * 1000,
      });

      console.log(`Awarded 2 points to user ${userId} for AI chat`);
    } catch (error) {
      console.error("Error awarding AI points:", error);
    }
  }

  private setupAIMessageHandler(): void {
    // AI message handling is now integrated into the main message handler above
    // This method exists for potential future separation if needed
    console.log(
      "AI message handler setup integrated into main message handler"
    );
  }

  // AI utility functions
  private sanitizeMarkdown(text: string): string {
    if (!text) return text;

    let sanitized = text;

    // Handle unclosed bold/italic formatting
    const boldStarCount = (sanitized.match(/\*/g) || []).length;
    if (boldStarCount % 2 !== 0) {
      sanitized += "*";
    }

    const underscoreCount = (sanitized.match(/_/g) || []).length;
    if (underscoreCount % 2 !== 0) {
      sanitized += "_";
    }

    // Ensure there are no broken links
    sanitized = sanitized.replace(/\[([^\]]+)\]\([^\)]*$/g, "$1");
    sanitized = sanitized.replace(/\[([^\]]+)$/g, "$1");

    // Handle backticks
    const backtickCount = (sanitized.match(/`/g) || []).length;
    if (backtickCount % 2 !== 0) {
      sanitized += "`";
    }

    return sanitized;
  }

  private stripMarkdown(text: string): string {
    if (!text) return text;

    let plainText = text.replace(/\*\*(.+?)\*\*/g, "$1"); // Bold
    plainText = plainText.replace(/\*(.+?)\*/g, "$1"); // Italic with *
    plainText = plainText.replace(/_(.+?)_/g, "$1"); // Italic with _
    plainText = plainText.replace(/\[(.+?)\]\(.+?\)/g, "$1"); // Links
    plainText = plainText.replace(/`(.+?)`/g, "$1"); // Code blocks

    return plainText;
  }

  private async sendSplitMessage(ctx: any, messageText: string): Promise<void> {
    const MAX_MESSAGE_LENGTH = 4000;

    messageText = this.sanitizeMarkdown(messageText);

    if (messageText.length <= MAX_MESSAGE_LENGTH) {
      try {
        return await ctx.reply(messageText, { parse_mode: "Markdown" });
      } catch (err) {
        console.error(
          "Error sending message with markdown, retrying without formatting:",
          err instanceof Error ? err.message : err
        );
        return await ctx.reply(this.stripMarkdown(messageText));
      }
    }

    // Split long message into chunks
    let position = 0;
    while (position < messageText.length) {
      let chunk = messageText.substring(
        position,
        position + MAX_MESSAGE_LENGTH
      );

      if (position + MAX_MESSAGE_LENGTH < messageText.length) {
        const paragraphBreak = chunk.lastIndexOf("\n\n");
        if (paragraphBreak > MAX_MESSAGE_LENGTH / 2) {
          chunk = chunk.substring(0, paragraphBreak);
          position += paragraphBreak + 2;
        } else {
          const sentenceEnd = Math.max(
            chunk.lastIndexOf(". "),
            chunk.lastIndexOf("! "),
            chunk.lastIndexOf("? ")
          );

          if (sentenceEnd > MAX_MESSAGE_LENGTH / 2) {
            chunk = chunk.substring(0, sentenceEnd + 1);
            position += sentenceEnd + 1;
          } else {
            position += MAX_MESSAGE_LENGTH;
          }
        }
      } else {
        position += chunk.length;
      }

      try {
        await ctx.replyWithChatAction("typing");
        await ctx.reply(chunk, { parse_mode: "Markdown" });
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        console.error("Error sending message chunk:", err);
        if (
          (err instanceof Error &&
            err.message.includes("can't parse entities")) ||
          (err instanceof Error && err.message.includes("Bad Request"))
        ) {
          await ctx.reply(this.stripMarkdown(chunk));
        }
      }
    }
  }

  // Helper function to update user streak
  private async updateUserStreak(userId: string): Promise<void> {
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Get user's current streak
      let streak = await prisma.userStreak.findUnique({
        where: { userId },
      });

      if (!streak) {
        // Create streak record if it doesn't exist
        streak = await prisma.userStreak.create({
          data: {
            userId,
            telegramStreak: 0,
            discordStreak: 0,
            twitterStreak: 0,
          },
        });
      }

      const lastActivity = streak.lastTelegram;

      if (!lastActivity) {
        // First activity
        await prisma.userStreak.update({
          where: { userId },
          data: {
            telegramStreak: 1,
            lastTelegram: now,
          },
        });
        return;
      }

      const lastDate = new Date(lastActivity);
      lastDate.setHours(0, 0, 0, 0);

      if (lastDate.getTime() === today.getTime()) {
        // Already updated streak today
        return;
      }

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate.getTime() === yesterday.getTime()) {
        // Consecutive day - increment streak
        const newStreakValue = streak.telegramStreak + 1;

        await prisma.userStreak.update({
          where: { userId },
          data: {
            telegramStreak: newStreakValue,
            lastTelegram: now,
          },
        });

        // Award bonus points for every 3rd day
        if (newStreakValue % 3 === 0) {
          await prisma.$transaction([
            prisma.pointTransaction.create({
              data: {
                userId,
                amount: 5,
                reason: "STREAK_BONUS",
                platform: "TELEGRAM",
                metadata: { days: newStreakValue },
              },
            }),
            prisma.user.update({
              where: { id: userId },
              data: {
                points: { increment: 5 },
                lifetimePoints: { increment: 5 },
              },
            }),
          ]);

          console.log(
            `Awarded 5 bonus points to user ${userId} for ${newStreakValue}-day streak`
          );
        }
      } else {
        // Streak broken - reset to 1
        await prisma.userStreak.update({
          where: { userId },
          data: {
            telegramStreak: 1,
            lastTelegram: now,
          },
        });
      }
    } catch (error) {
      console.error("Error updating streak:", error);
    }
  }

  async start(): Promise<void> {
    try {
      // Register core commands (temporarily disabled due to 401 error)
      // TODO: Re-enable when bot token issues are resolved
      /*
      await this.bot.api.setMyCommands([
        { command: "help", description: "Show available commands" },
        { command: "soulie", description: "Ask AI anything about SOLess" },
        { command: "eli5", description: "Switch to simple explanations" },
        { command: "normal", description: "Switch to normal explanations" },
        { command: "verify", description: "Verify your account with a code" },
        { command: "soulieplay", description: "Share music and earn points" },
        { command: "solfact", description: "Share a random SOLess fact" },
        { command: "points", description: "Check your points and stats" },
        { command: "leaderboard", description: "View the points leaderboard" },
      ]);
      */

      // Start polling
      await this.bot.start({
        drop_pending_updates: true,
        onStart: (botInfo) => {
          console.log(`Telegram bot ${botInfo.username} started with polling`);
          this.isRunning = true;
        },
      });
    } catch (error) {
      console.error("Failed to start bot:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.bot.stop();
      this.isRunning = false;
      console.log("Telegram bot stopped");
    } catch (error) {
      console.error("Error stopping bot:", error);
    }
  }

  getBot(): Bot {
    return this.bot;
  }
}
