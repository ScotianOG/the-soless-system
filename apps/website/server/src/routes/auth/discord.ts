import { Router, Request, Response, RequestHandler } from "express";
import { AuthService } from "../../services/AuthService";
import { logger } from "../../utils/logger";

interface DiscordCallbackQuery {
  code?: string;
  state?: string;
}

interface DiscordAuthQuery {
  wallet?: string;
}

const router = Router();
const authService = AuthService.getInstance();

// Discord OAuth callback
const handleDiscordCallback: RequestHandler<{}, {}, {}, DiscordCallbackQuery> = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      res.status(400).json({ error: "Missing required parameters" });
      return;
    }

    // Decode the state parameter to get the wallet address
    let wallet: string;
    try {
      const decodedState = JSON.parse(Buffer.from(state as string, "base64").toString());
      wallet = decodedState.wallet;
      if (!wallet) {
        throw new Error("No wallet address provided");
      }
    } catch (error) {
      logger.error("Failed to parse state parameter:", error);
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

    const result = await authService.handleDiscordCallback(code as string, wallet);

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
  } catch (error) {
    logger.error("Discord callback error:", error);
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
const handleDiscordAuth: RequestHandler<{}, {}, {}, DiscordAuthQuery> = async (req, res) => {
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
  } catch (error) {
    logger.error("Discord auth error:", error);
    res.status(500).json({ error: "Failed to initiate Discord auth" });
  }
};

router.get("/callback", handleDiscordCallback);
router.get("/", handleDiscordAuth);

export const discordAuthRouter = router;
