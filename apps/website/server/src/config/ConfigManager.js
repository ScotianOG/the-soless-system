"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configManager = exports.ConfigManager = exports.ConfigValidationError = void 0;
// server/src/config/ConfigManager.ts
const zod_1 = require("zod");
const uuid_1 = require("uuid");
// Validation schemas
const PlatformConfigSchema = zod_1.z.object({
    chatId: zod_1.z.string().optional(),
    guildId: zod_1.z.string().optional(),
    webhookUrl: zod_1.z.string().url().optional().or(zod_1.z.literal("")).optional(),
    enabled: zod_1.z.boolean().default(true),
});
const PointConfigSchema = zod_1.z.object({
    points: zod_1.z.number().min(0).max(100),
    cooldown: zod_1.z.number().min(0).optional(),
    dailyLimit: zod_1.z.number().min(1).optional(),
});
const ContestConfigSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
    roundDurationHours: zod_1.z.number().min(1).max(168), // 1 hour to 1 week
    minPointsToQualify: zod_1.z.number().min(0),
    maxParticipants: zod_1.z.number().min(1).optional(),
    prizes: zod_1.z.array(zod_1.z.object({
        rank: zod_1.z.number().min(1),
        reward: zod_1.z.string(),
        amount: zod_1.z.string(),
        description: zod_1.z.string(),
    })),
});
const EngagementConfigSchema = zod_1.z.object({
    points: zod_1.z.record(zod_1.z.string(), zod_1.z.record(zod_1.z.string(), PointConfigSchema)),
    platforms: zod_1.z.record(zod_1.z.string(), PlatformConfigSchema.partial()),
    contests: ContestConfigSchema,
    rateLimits: zod_1.z.object({
        maxPointsPerDay: zod_1.z.number().min(1),
        maxInvitesPerDay: zod_1.z.number().min(1),
        maxCommandsPerMinute: zod_1.z.number().min(1),
    }),
    features: zod_1.z.record(zod_1.z.string(), zod_1.z.boolean()),
    roles: zod_1.z
        .object({
        admin: zod_1.z.array(zod_1.z.string()),
    })
        .optional(),
});
class ConfigValidationError extends Error {
    constructor(message, field, value, correlationId) {
        super(message);
        this.field = field;
        this.value = value;
        this.code = "CONFIG_VALIDATION_ERROR";
        this.name = "ConfigValidationError";
        this.correlationId = correlationId || (0, uuid_1.v4)();
    }
}
exports.ConfigValidationError = ConfigValidationError;
class ConfigManager {
    constructor() {
        this.environment = process.env.NODE_ENV || "development";
        this.correlationId = (0, uuid_1.v4)();
        this.loadConfig();
    }
    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    loadConfig() {
        try {
            // Load base configuration
            const baseConfig = require("./engagement");
            // Apply environment-specific overrides
            const envOverrides = this.loadEnvironmentOverrides();
            // Merge configurations
            this.config = this.mergeConfigs(baseConfig.ENGAGEMENT_CONFIG, envOverrides);
            // Validate configuration
            this.validateConfig();
            // Apply runtime fixes for testing values
            this.applyRuntimeFixes();
        }
        catch (error) {
            throw new ConfigValidationError(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`, "config_load", error, this.correlationId);
        }
    }
    loadEnvironmentOverrides() {
        const overrides = {};
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
        }
        else if (this.environment === "staging") {
            overrides.contests = {
                minPointsToQualify: 50, // Staging requires 50 points
                roundDurationHours: 24, // 1 day rounds in staging
            };
        }
        else {
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
    mergeConfigs(base, overrides) {
        return this.deepMerge(base, overrides);
    }
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] &&
                typeof source[key] === "object" &&
                !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            }
            else {
                result[key] = source[key];
            }
        }
        return result;
    }
    validateConfig() {
        try {
            // Validate required environment variables
            this.validateRequiredEnvVars();
            // Validate configuration structure
            EngagementConfigSchema.parse(this.config);
            // Custom validation rules
            this.validateCustomRules();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const firstError = error.errors[0];
                throw new ConfigValidationError(`Configuration validation failed: ${firstError.message}`, firstError.path.join("."), firstError.received || "unknown", this.correlationId);
            }
            throw error;
        }
    }
    validateRequiredEnvVars() {
        const requiredVars = [];
        if (this.environment === "production") {
            requiredVars.push("DATABASE_URL", "REDIS_URL", "TELEGRAM_BOT_TOKEN", "DISCORD_BOT_TOKEN");
        }
        for (const varName of requiredVars) {
            if (!process.env[varName]) {
                throw new ConfigValidationError(`Required environment variable ${varName} is missing`, "environment", varName, this.correlationId);
            }
        }
    }
    validateCustomRules() {
        // Validate contest prize amounts
        const prizes = this.config.contests.prizes;
        for (let i = 0; i < prizes.length - 1; i++) {
            const current = parseFloat(prizes[i].amount);
            const next = parseFloat(prizes[i + 1].amount);
            if (current <= next) {
                throw new ConfigValidationError(`Prize amounts should decrease by rank: rank ${prizes[i].rank} (${current}) should be greater than rank ${prizes[i + 1].rank} (${next})`, "contests.prizes", prizes, this.correlationId);
            }
        }
        // Validate point values are reasonable
        for (const platform in this.config.points) {
            for (const action in this.config.points[platform]) {
                const points = this.config.points[platform][action].points;
                if (points > 100) {
                    throw new ConfigValidationError(`Point value too high: ${platform}.${action} has ${points} points (max 100)`, `points.${platform}.${action}`, points, this.correlationId);
                }
            }
        }
    }
    applyRuntimeFixes() {
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
    getConfig() {
        return { ...this.config };
    }
    getContestConfig() {
        return { ...this.config.contests };
    }
    getPlatformConfig(platform) {
        return { ...this.config.platforms[platform] };
    }
    getPointsConfig() {
        return { ...this.config.points };
    }
    getRateLimits() {
        return { ...this.config.rateLimits };
    }
    getRateLimitConfig() {
        return { ...this.config.rateLimits };
    }
    getRoleConfig() {
        return { ...this.config.roles };
    }
    getEnvironment() {
        return this.environment;
    }
    isFeatureEnabled(feature) {
        return this.config.features[feature] === true;
    }
    isPlatformEnabled(platform) {
        return this.config.platforms[platform]?.enabled === true;
    }
    getCorrelationId() {
        return this.correlationId;
    }
    // Hot reload configuration (for development)
    reloadConfig() {
        if (this.environment !== "production") {
            this.correlationId = (0, uuid_1.v4)();
            this.loadConfig();
        }
    }
    // Validate a specific configuration section
    validateSection(section, data) {
        try {
            switch (section) {
                case "contests":
                    ContestConfigSchema.parse(data);
                    break;
                case "points":
                    zod_1.z.record(zod_1.z.string(), zod_1.z.record(zod_1.z.string(), PointConfigSchema)).parse(data);
                    break;
                default:
                    throw new ConfigValidationError(`Unknown configuration section: ${section}`, section, data, this.correlationId);
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.ConfigManager = ConfigManager;
// Export singleton instance
exports.configManager = ConfigManager.getInstance();
exports.default = exports.configManager;
