# SOLess Bot System

This directory contains the bot integration system for the SOLess community platform, supporting multiple social platforms:

- Telegram
- Discord
- Twitter

## Architecture

The bot system uses a singleton `BotManager` that manages instances of platform-specific bots:

```
BotManager
│
├── TelegramBot
│   ├── Command handlers
│   └── Message handlers
│
├── DiscordBot
│   ├── Command handlers
│   └── Message handlers
│
└── TwitterBot
    ├── Tweet handlers
    └── Stream handlers
```

## Setup

### Environment Variables

The bot system requires several environment variables to be set up. See the `.env.example` file for reference:

```
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_server_id

# Twitter API
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_token_secret
```

### Starting the Bot System

The bot system is started automatically when the server starts. You can also run it directly using:

```bash
npx ts-node src/core/bots/index.ts
```

## Supported Commands

### Telegram Commands

- `/help` - Shows available commands
- `/verify [code]` - Verifies user account
- `/points` - Displays user stats
- `/leaderboard` - Shows top users
- `/solfact` - Shares a random SOLess fact
- `/soulieplay [song]` - Shares music

### Discord Commands

- `/help` - Shows available commands
- `/verify [code]` - Verifies user account
- `/points` - Displays user stats
- `/leaderboard` - Shows top users
- `/solfact` - Shares a random SOLess fact
- `/soulieplay [song]` - Shares music

### Twitter Integration

- Monitors mentions of SOLess keywords
- Tracks user engagement with SOLess content
- Rewards users for sharing SOLess content

## Engagement Tracking

Engagement is tracked across all platforms in a consistent way. The main engagement types are:

| Event Type    | Description                                 |
| ------------- | ------------------------------------------- |
| MUSIC_SHARE   | Sharing music via platform commands         |
| FACT_SHARE    | Sharing SOLess facts                        |
| MESSAGE       | Regular messages containing SOLess keywords |
| QUALITY_POST  | Messages with more than 10 words            |
| MENTION       | Mentioning other users                      |
| TEACHING_POST | Longer informative posts                    |
| STREAK_BONUS  | Rewards for consistent daily activity       |
| INVITE        | When someone joins via a user's invite      |

## User Verification

For each platform, users need to verify their accounts by linking them to their wallet address:

1. User registers with their wallet address on the SOLess website
2. User requests a verification code for a specific platform
3. User enters the verification code in the platform's bot
4. The platform account is linked to the user's wallet

## Extending the Bot System

To extend the bot system to new platforms:

1. Create a new class that extends `BasePlatformBot`
2. Implement the required methods (`start`, `stop`)
3. Create appropriate handler classes
4. Update `BotManager` to initialize and manage the new platform bot
