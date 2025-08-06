"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordAdminHandler = void 0;
const AdminHandler_1 = require("../../../handlers/AdminHandler");
const ConfigManager_1 = require("../../../../../config/ConfigManager");
const prisma_1 = require("../../../../../lib/prisma");
class DiscordAdminHandler extends AdminHandler_1.AdminHandler {
    constructor(client, // Replace 'any' with the correct Discord.js Client type
    engagementTracker, userManager, rewardManager) {
        super("DISCORD", engagementTracker, userManager, rewardManager);
        this.client = client;
    }
    async isAdmin(userId) {
        try {
            const guild = await this.getMainGuild();
            const member = await guild.members.fetch(userId);
            return (member.permissions.has("ADMINISTRATOR") ||
                member.roles.cache.some((role) => ConfigManager_1.configManager.getRoleConfig().admin.includes(role.name)));
        }
        catch (error) {
            console.error("Error checking admin status:", error);
            return false;
        }
    }
    async getMainGuild() {
        const guilds = this.client.guilds.cache;
        const guild = guilds.first();
        if (!guild) {
            throw new Error("Bot is not connected to any guild");
        }
        return guild;
    }
    async handleAdminCommand(command, args, message) {
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
                await message.reply("Unknown admin command. Use !adminhelp for available commands.");
        }
    }
    async handleSetPoints(args, message) {
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
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: { points },
            });
            await message.reply(`Updated points for user ${userId} to ${points}`);
        }
        catch (error) {
            console.error("Error setting points:", error);
            await message.reply("Failed to update points.");
        }
    }
    async handleContestCommand(args, message) {
        if (args.length < 1) {
            await message.reply("Usage: !contest <start|end>");
            return;
        }
        const action = args[0].toLowerCase();
        try {
            switch (action) {
                case "start":
                    const currentContest = await prisma_1.prisma.contest.findFirst({
                        where: { status: "ACTIVE" },
                    });
                    if (currentContest) {
                        await message.reply("There is already an active contest.");
                        return;
                    }
                    await prisma_1.prisma.contest.create({
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
                    const contest = await prisma_1.prisma.contest.findFirst({
                        where: { status: "ACTIVE" },
                    });
                    if (!contest) {
                        await message.reply("No active contest found.");
                        return;
                    }
                    await prisma_1.prisma.contest.update({
                        where: { id: contest.id },
                        data: { status: "COMPLETED", endTime: new Date() },
                    });
                    await message.reply("Contest ended!");
                    break;
                default:
                    await message.reply("Invalid contest command. Use start or end.");
            }
        }
        catch (error) {
            console.error("Error handling contest command:", error);
            await message.reply("Failed to process contest command.");
        }
    }
    async handleStats(message) {
        try {
            const totalUsers = await prisma_1.prisma.user.count();
            const activeUsers = await prisma_1.prisma.user.count({
                where: {
                    lastActive: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                    },
                },
            });
            const totalEngagements = await prisma_1.prisma.engagement.count();
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
        }
        catch (error) {
            console.error("Error fetching stats:", error);
            await message.reply("Failed to fetch platform statistics.");
        }
    }
    async handleAnnouncement(args, message) {
        const announcement = args.join(" ");
        if (!announcement) {
            await message.reply("Please provide an announcement message.");
            return;
        }
        const announcementChannel = message.guild?.channels.cache.find((channel) => channel.name === "announcements");
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
exports.DiscordAdminHandler = DiscordAdminHandler;
