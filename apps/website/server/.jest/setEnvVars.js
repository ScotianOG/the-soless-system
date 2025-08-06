process.env.DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/soless_dev";
process.env.JWT_SECRET = "test_secret";
process.env.TELEGRAM_BOT_TOKEN = "test_token";
process.env.TELEGRAM_CHAT_ID = "test_chat_id";
process.env.VITE_FRONTEND_URL = "http://localhost:5173";
process.env.DISCORD_BOT_TOKEN = "test-token";
process.env.TWITTER_API_KEY = "test-key";
process.env.TWITTER_API_SECRET = "test-secret";
process.env.TWITTER_ACCESS_TOKEN = "test-token";
process.env.TWITTER_ACCESS_SECRET = "test-secret";

// Contest and engagement configuration
process.env.ENGAGEMENT_CONFIG = JSON.stringify({
  contests: {
    roundDurationHours: 24,
    minPointsToQualify: 50,
    tiers: [
      {
        name: "BRONZE",
        minPoints: 50,
        reward: "FREE_MINT_1",
      },
      {
        name: "SILVER",
        minPoints: 100,
        reward: "FREE_MINT_2",
      },
      {
        name: "GOLD",
        minPoints: 200,
        reward: "FREE_MINT_3",
      },
    ],
  },
  points: {
    MESSAGE: 5,
    REACTION: 2,
    VOICE_CHAT: 10,
  },
});
