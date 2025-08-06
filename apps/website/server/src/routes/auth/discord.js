"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordAuthRouter = void 0;
const express_1 = require("express");
const AuthService_1 = require("../../services/AuthService");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
const authService = AuthService_1.AuthService.getInstance();
// Discord OAuth callback
const handleDiscordCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code || !state) {
            res.status(400).json({ error: "Missing required parameters" });
            return;
        }
        // Decode the state parameter to get the wallet address
        let wallet;
        try {
            const decodedState = JSON.parse(Buffer.from(state, "base64").toString());
            wallet = decodedState.wallet;
            if (!wallet) {
                throw new Error("No wallet address provided");
            }
        }
        catch (error) {
            logger_1.logger.error("Failed to parse state parameter:", error);
            res.setHeader("Content-Type", "text/html");
            res.send(`
        <script>
          window.opener.postMessage(
            { 
              type: 'DISCORD_AUTH_ERROR',
              error: 'Invalid state parameter'
            }, 
            '*'
          );
          window.close();
        </script>
      `);
            return;
        }
        const result = await authService.handleDiscordCallback(code, wallet);
        // Send success response to close popup window
        res.setHeader("Content-Type", "text/html");
        res.send(`
      <script>
        window.opener.postMessage(
          { 
            type: 'DISCORD_AUTH_SUCCESS',
            username: '${result.username}'
          }, 
          '*'
        );
        window.close();
      </script>
    `);
    }
    catch (error) {
        logger_1.logger.error("Discord callback error:", error);
        res.setHeader("Content-Type", "text/html");
        res.send(`
      <script>
        window.opener.postMessage(
          { 
            type: 'DISCORD_AUTH_ERROR',
            error: 'Discord authentication failed'
          }, 
          '*'
        );
        window.close();
      </script>
    `);
    }
};
// Initiate Discord OAuth
const handleDiscordAuth = async (req, res) => {
    try {
        const { wallet } = req.query;
        if (!wallet) {
            res.status(400).json({ error: "Wallet address is required" });
            return;
        }
        // Create a state parameter that includes the wallet address
        const state = Buffer.from(JSON.stringify({ wallet })).toString("base64");
        // Get Discord OAuth URL
        const authUrl = await authService.getDiscordAuthUrl(state);
        res.redirect(authUrl);
    }
    catch (error) {
        logger_1.logger.error("Discord auth error:", error);
        res.status(500).json({ error: "Failed to initiate Discord auth" });
    }
};
router.get("/callback", handleDiscordCallback);
router.get("/", handleDiscordAuth);
exports.discordAuthRouter = router;
