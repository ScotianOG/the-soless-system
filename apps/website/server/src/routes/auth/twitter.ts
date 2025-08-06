import { Router, Request, Response, RequestHandler } from "express";
import { AuthService } from "../../services/AuthService";
import { logger } from "../../utils/logger";

interface TwitterCallbackQuery {
  code?: string;
  state?: string;
}

interface TwitterAuthQuery {
  wallet?: string;
}

const router = Router();
const authService = AuthService.getInstance();

// Twitter OAuth callback
const handleTwitterCallback: RequestHandler<{}, {}, {}, TwitterCallbackQuery> = async (req, res) => {
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
              type: 'TWITTER_AUTH_ERROR',
              error: 'Invalid state parameter'
            }, 
            '*'
          );
          window.close();
        </script>
      `);
      return;
    }

    const result = await authService.handleTwitterCallback(code as string, wallet);

    // Send success response to close popup window
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <script>
        window.opener.postMessage(
          { 
            type: 'TWITTER_AUTH_SUCCESS',
            username: '${result.username}'
          }, 
          '*'
        );
        window.close();
      </script>
    `);
  } catch (error) {
    logger.error("Twitter callback error:", error);
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <script>
        window.opener.postMessage(
          { 
            type: 'TWITTER_AUTH_ERROR',
            error: 'Twitter authentication failed'
          }, 
          '*'
        );
        window.close();
      </script>
    `);
  }
};

// Initiate Twitter OAuth
const handleTwitterAuth: RequestHandler<{}, {}, {}, TwitterAuthQuery> = async (req, res) => {
  try {
    const { wallet } = req.query;

    if (!wallet) {
      res.status(400).json({ error: "Wallet address is required" });
      return;
    }

    // Create a state parameter that includes the wallet address
    const state = Buffer.from(JSON.stringify({ wallet })).toString("base64");

    // Get Twitter OAuth URL
    const authUrl = await authService.getTwitterAuthUrl(state);
    res.redirect(authUrl);
  } catch (error) {
    logger.error("Twitter auth error:", error);
    res.status(500).json({ error: "Failed to initiate Twitter auth" });
  }
};

router.get("/callback", handleTwitterCallback);
router.get("/", handleTwitterAuth);

export const twitterAuthRouter = router;
