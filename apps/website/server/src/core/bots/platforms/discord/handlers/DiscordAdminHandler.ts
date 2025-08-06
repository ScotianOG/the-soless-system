// src/core/bots/platforms/discord/handlers/DiscordAdminHandler.ts
import { Message, GuildMember, Role, TextChannel } from "discord.js";
import { AdminHandler } from "../../../handlers/AdminHandler";
import { configManager } from "../../../../../config/ConfigManager";
import { EngagementTracker } from "../../../../../core/engagement/EngagementTracker";
import { UserManager } from "../../../../../core/user/UserManager";
import { RewardManager } from "../../../../../core/contest/RewardManager";
import { prisma } from "../../../../../lib/prisma";

export class DiscordAdminHandler extends AdminHandler {
  private client: any; // Replace 'any' with the correct Discord.js Client type

  constructor(
    client: any, // Replace 'any' with the correct Discord.js Client type
    engagementTracker: EngagementTracker,
    userManager: UserManager,
    rewardManager: RewardManager
  ) {
    super("DISCORD", engagementTracker, userManager, rewardManager);
    this.client = client;
  }

  async isAdmin(userId: string): Promise<boolean> {
    try {
      const guild = await this.getMainGuild();
      const member = await guild.members.fetch(userId);
      return (
        member.permissions.has("ADMINISTRATOR") ||
        member.roles.cache.some((role: Role) =>
          configManager.getRoleConfig().admin.includes(role.name)
        )
      );
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }

  public async getMainGuild() {
    const guilds = this.client.guilds.cache;
    const guild = guilds.first();
    if (!guild) {
      throw new Error("Bot is not connected to any guild");
    }
    return guild;
  }

  async handleAdminCommand(
    command: string,
    args: string[],
    message: Message
  ): Promise<void> {
    if (!(await this.isAdmin(message.author.id))) {
      await message.reply("This command is for administrators only.");
      return;
    }

    switch (command.toLowerCase()) {
      case "announce":
        await this.handleAnnouncement(args, message);
        break;
      case "setpoints":
        await this.handleSetPoints(args, message);
        break;
      case "stats":
        await this.handleStats(message);
        break;
      case "contest":
        await this.handleContestCommand(args, message);
        break;
      default:
        await message.reply(
          "Unknown admin command. Use !adminhelp for available commands."
        );
    }
  }

  async handleSetPoints(args: string[], message: Message): Promise<void> {
    if (args.length < 2) {
      await message.reply("Usage: !setpoints <userId> <points>");
      return;
    }

    const userId = args[0];
    const points = parseInt(args[1]);

    if (isNaN(points)) {
      await message.reply("Points must be a valid number.");
      return;
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { points },
      });

      await message.reply(`Updated points for user ${userId} to ${points}`);
    } catch (error) {
      console.error("Error setting points:", error);
      await message.reply("Failed to update points.");
    }
  }

  async handleContestCommand(args: string[], message: Message): Promise<void> {
    if (args.length < 1) {
      await message.reply("Usage: !contest <start|end>");
      return;
    }

    const action = args[0].toLowerCase();

    try {
      switch (action) {
        case "start":
          const currentContest = await prisma.contest.findFirst({
            where: { status: "ACTIVE" },
          });

          if (currentContest) {
            await message.reply("There is already an active contest.");
            return;
          }

          await prisma.contest.create({
            data: {
              name: `Contest ${new Date().toISOString()}`,
              startTime: new Date(),
              endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              status: "ACTIVE",
            },
          });

          await message.reply("New contest started!");
          break;

        case "end":
          const contest = await prisma.contest.findFirst({
            where: { status: "ACTIVE" },
          });

          if (!contest) {
            await message.reply("No active contest found.");
            return;
          }

          await prisma.contest.update({
            where: { id: contest.id },
            data: { status: "COMPLETED", endTime: new Date() },
          });

          await message.reply("Contest ended!");
          break;

        default:
          await message.reply("Invalid contest command. Use start or end.");
      }
    } catch (error) {
      console.error("Error handling contest command:", error);
      await message.reply("Failed to process contest command.");
    }
  }

  async handleStats(message: Message): Promise<void> {
    try {
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });
      const totalEngagements = await prisma.engagement.count();

      const statsEmbed = {
        title: "Platform Statistics",
        fields: [
          { name: "Total Users", value: totalUsers.toString(), inline: true },
          {
            name: "Active Users (24h)",
            value: activeUsers.toString(),
            inline: true,
          },
          {
            name: "Total Engagements",
            value: totalEngagements.toString(),
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await message.reply({ embeds: [statsEmbed] });
    } catch (error) {
      console.error("Error fetching stats:", error);
      await message.reply("Failed to fetch platform statistics.");
    }
  }

  private async handleAnnouncement(
    args: string[],
    message: Message
  ): Promise<void> {
    const announcement = args.join(" ");
    if (!announcement) {
      await message.reply("Please provide an announcement message.");
      return;
    }

    const announcementChannel = message.guild?.channels.cache.find(
      (channel) => channel.name === "announcements"
    ) as TextChannel;

    if (!announcementChannel?.isTextBased()) {
      await message.reply("Could not find announcements channel.");
      return;
    }

    await announcementChannel.send({
      content: `📢 **Announcement**\n\n${announcement}`,
      allowedMentions: { parse: ["users", "roles"] },
    });

    await message.reply("Announcement sent successfully!");
  }
}
