// server/src/config/ConfigManager.ts
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Validation schemas
const PlatformConfigSchema = z.object({
  chatId: z.string().optional(),
  guildId: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal("")).optional(),
  enabled: z.boolean().default(true),
});

const PointConfigSchema = z.object({
  points: z.number().min(0).max(100),
  cooldown: z.number().min(0).optional(),
  dailyLimit: z.number().min(1).optional(),
});

const ContestConfigSchema = z.object({
  enabled: z.boolean(),
  roundDurationHours: z.number().min(1).max(168), // 1 hour to 1 week
  minPointsToQualify: z.number().min(0),
  maxParticipants: z.number().min(1).optional(),
  prizes: z.array(
    z.object({
      rank: z.number().min(1),
      reward: z.string(),
      amount: z.string(),
      description: z.string(),
    })
  ),
});

const EngagementConfigSchema = z.object({
  points: z.record(z.string(), z.record(z.string(), PointConfigSchema)),
  platforms: z.record(z.string(), PlatformConfigSchema.partial()),
  contests: ContestConfigSchema,
  rateLimits: z.object({
    maxPointsPerDay: z.number().min(1),
    maxInvitesPerDay: z.number().min(1),
    maxCommandsPerMinute: z.number().min(1),
  }),
  features: z.record(z.string(), z.boolean()),
  roles: z
    .object({
      admin: z.array(z.string()),
    })
    .optional(),
});

export class ConfigValidationError extends Error {
  public readonly code = "CONFIG_VALIDATION_ERROR";
  public readonly correlationId: string;

  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any,
    correlationId?: string
  ) {
    super(message);
    this.name = "ConfigValidationError";
    this.correlationId = correlationId || uuidv4();
  }
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: any;
  private environment: string;
  private correlationId: string;

  private constructor() {
    this.environment = process.env.NODE_ENV || "development";
    this.correlationId = uuidv4();
    this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): void {
    try {
      // Load base configuration
      const baseConfig = require("./engagement");

      // Apply environment-specific overrides
      const envOverrides = this.loadEnvironmentOverrides();

      // Merge configurations
      this.config = this.mergeConfigs(
        baseConfig.ENGAGEMENT_CONFIG,
        envOverrides
      );

      // Validate configuration
      this.validateConfig();

      // Apply runtime fixes for testing values
      this.applyRuntimeFixes();
    } catch (error) {
      throw new ConfigValidationError(
        `Failed to load configuration: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "config_load",
        error,
        this.correlationId
      );
    }
  }

  private loadEnvironmentOverrides(): any {
    const overrides: any = {};

    // Environment-specific contest settings
    if (this.environment === "production") {
      overrides.contests = {
        minPointsToQualify: 100, // Production requires 100 points
        roundDurationHours: 168, // 1 week rounds in production
        prizes: [
          {
            rank: 1,
            reward: "USDC",
            amount: "250",
            description: "First Place - 250 USDC",
          },
          {
            rank: 2,
            reward: "USDC",
            amount: "150",
            description: "Second Place - 150 USDC",
          },
          {
            rank: 3,
            reward: "USDC",
            amount: "100",
            description: "Third Place - 100 USDC",
          },
          {
            rank: 4,
            reward: "USDC",
            amount: "50",
            description: "Fourth Place - 50 USDC",
          },
          {
            rank: 5,
            reward: "USDC",
            amount: "25",
            description: "Fifth Place - 25 USDC",
          },
        ],
      };
    } else if (this.environment === "staging") {
      overrides.contests = {
        minPointsToQualify: 50, // Staging requires 50 points
        roundDurationHours: 24, // 1 day rounds in staging
      };
    } else {
      // Development/testing - keep test values
      overrides.contests = {
        minPointsToQualify: 0, // No qualification needed for testing
        roundDurationHours: 1, // 1 hour rounds for testing
      };
    }

    // Environment-specific rate limits
    if (this.environment === "production") {
      overrides.rateLimits = {
        maxPointsPerDay: 500, // Production limit
        maxCommandsPerMinute: 5, // Stricter production limits
      };
    }

    // Platform-specific environment overrides
    overrides.platforms = {
      TELEGRAM: {
        chatId: process.env.TELEGRAM_CHAT_ID || "",
        webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || "",
        enabled: !!process.env.TELEGRAM_BOT_TOKEN,
      },
      DISCORD: {
        guildId: process.env.DISCORD_GUILD_ID || "",
        enabled: !!process.env.DISCORD_BOT_TOKEN,
      },
      TWITTER: {
        webhookUrl: process.env.TWITTER_WEBHOOK_URL || "",
        enabled: !!process.env.TWITTER_API_KEY,
      },
    };

    return overrides;
  }

  private mergeConfigs(base: any, overrides: any): any {
    return this.deepMerge(base, overrides);
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  private validateConfig(): void {
    try {
      // Validate required environment variables
      this.validateRequiredEnvVars();

      // Validate configuration structure
      EngagementConfigSchema.parse(this.config);

      // Custom validation rules
      this.validateCustomRules();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ConfigValidationError(
          `Configuration validation failed: ${firstError.message}`,
          firstError.path.join("."),
          (firstError as any).received || "unknown",
          this.correlationId
        );
      }
      throw error;
    }
  }

  private validateRequiredEnvVars(): void {
    const requiredVars = [];

    if (this.environment === "production") {
      requiredVars.push(
        "DATABASE_URL",
        "REDIS_URL",
        "TELEGRAM_BOT_TOKEN",
        "DISCORD_BOT_TOKEN"
      );
    }

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new ConfigValidationError(
          `Required environment variable ${varName} is missing`,
          "environment",
          varName,
          this.correlationId
        );
      }
    }
  }

  private validateCustomRules(): void {
    // Validate contest prize amounts
    const prizes = this.config.contests.prizes;
    for (let i = 0; i < prizes.length - 1; i++) {
      const current = parseFloat(prizes[i].amount);
      const next = parseFloat(prizes[i + 1].amount);
      if (current <= next) {
        throw new ConfigValidationError(
          `Prize amounts should decrease by rank: rank ${
            prizes[i].rank
          } (${current}) should be greater than rank ${
            prizes[i + 1].rank
          } (${next})`,
          "contests.prizes",
          prizes,
          this.correlationId
        );
      }
    }

    // Validate point values are reasonable
    for (const platform in this.config.points) {
      for (const action in this.config.points[platform]) {
        const points = this.config.points[platform][action].points;
        if (points > 100) {
          throw new ConfigValidationError(
            `Point value too high: ${platform}.${action} has ${points} points (max 100)`,
            `points.${platform}.${action}`,
            points,
            this.correlationId
          );
        }
      }
    }
  }

  private applyRuntimeFixes(): void {
    // Fix any inconsistencies or apply backward compatibility
    if (!this.config.contests.maxParticipants) {
      this.config.contests.maxParticipants = 1000; // Default max participants
    }

    // Ensure all platforms have required settings
    for (const platform of ["TELEGRAM", "DISCORD", "TWITTER"]) {
      if (!this.config.platforms[platform]) {
        this.config.platforms[platform] = { enabled: false };
      }
    }
  }

  // Public API
  public getConfig(): any {
    return { ...this.config };
  }

  public getContestConfig(): any {
    return { ...this.config.contests };
  }

  public getPlatformConfig(platform: string): any {
    return { ...this.config.platforms[platform] };
  }

  public getPointsConfig(): any {
    return { ...this.config.points };
  }

  public getRateLimits(): any {
    return { ...this.config.rateLimits };
  }

  public getRateLimitConfig(): any {
    return { ...this.config.rateLimits };
  }

  public getRoleConfig(): any {
    return { ...this.config.roles };
  }

  public getEnvironment(): string {
    return this.environment;
  }

  public isFeatureEnabled(feature: string): boolean {
    return this.config.features[feature] === true;
  }

  public isPlatformEnabled(platform: string): boolean {
    return this.config.platforms[platform]?.enabled === true;
  }

  public getCorrelationId(): string {
    return this.correlationId;
  }

  // Hot reload configuration (for development)
  public reloadConfig(): void {
    if (this.environment !== "production") {
      this.correlationId = uuidv4();
      this.loadConfig();
    }
  }

  // Validate a specific configuration section
  public validateSection(section: string, data: any): boolean {
    try {
      switch (section) {
        case "contests":
          ContestConfigSchema.parse(data);
          break;
        case "points":
          z.record(z.string(), z.record(z.string(), PointConfigSchema)).parse(
            data
          );
          break;
        default:
          throw new ConfigValidationError(
            `Unknown configuration section: ${section}`,
            section,
            data,
            this.correlationId
          );
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();
export default configManager;
