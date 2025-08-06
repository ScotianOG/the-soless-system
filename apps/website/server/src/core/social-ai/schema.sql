-- Migration: Add social AI tables
-- This extends your existing Prisma schema

-- Social activity tracking table
CREATE TABLE IF NOT EXISTS "social_activity" (
    "id" SERIAL PRIMARY KEY,
    "platform" VARCHAR(20) NOT NULL DEFAULT 'TWITTER',
    "action" VARCHAR(50) NOT NULL,
    "external_id" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "metrics" JSONB DEFAULT '{}',
    "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
    "user_id" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- System logs for social AI
CREATE TABLE IF NOT EXISTS "system_log" (
    "id" SERIAL PRIMARY KEY,
    "event" VARCHAR(100) NOT NULL,
    "source" VARCHAR(50) NOT NULL DEFAULT 'social_ai',
    "data" JSONB DEFAULT '{}',
    "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Social AI content templates
CREATE TABLE IF NOT EXISTS "content_template" (
    "id" SERIAL PRIMARY KEY,
    "type" VARCHAR(50) NOT NULL,
    "template" TEXT NOT NULL,
    "frequency" INTEGER DEFAULT 1,
    "time_slots" JSONB DEFAULT '[]',
    "active" BOOLEAN DEFAULT true,
    "performance_score" DECIMAL(3,2) DEFAULT 0.00,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Social metrics tracking
CREATE TABLE IF NOT EXISTS "social_metric" (
    "id" SERIAL PRIMARY KEY,
    "platform" VARCHAR(20) NOT NULL,
    "metric_type" VARCHAR(50) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Content performance tracking
CREATE TABLE IF NOT EXISTS "content_performance" (
    "id" SERIAL PRIMARY KEY,
    "social_activity_id" INTEGER REFERENCES "social_activity"("id"),
    "platform_post_id" VARCHAR(255) NOT NULL,
    "likes" INTEGER DEFAULT 0,
    "retweets" INTEGER DEFAULT 0,
    "replies" INTEGER DEFAULT 0,
    "impressions" INTEGER DEFAULT 0,
    "engagement_rate" DECIMAL(5,4) DEFAULT 0.0000,
    "recorded_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AI-generated content queue
CREATE TABLE IF NOT EXISTS "ai_content_queue" (
    "id" SERIAL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "content_type" VARCHAR(50) NOT NULL,
    "scheduled_for" TIMESTAMP,
    "status" VARCHAR(20) DEFAULT 'pending',
    "platform" VARCHAR(20) DEFAULT 'TWITTER',
    "priority" INTEGER DEFAULT 1,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Trending topics tracking
CREATE TABLE IF NOT EXISTS "trending_topic" (
    "id" SERIAL PRIMARY KEY,
    "topic" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "volume" INTEGER DEFAULT 0,
    "relevance_score" DECIMAL(3,2) DEFAULT 0.00,
    "first_seen" TIMESTAMP NOT NULL DEFAULT NOW(),
    "last_seen" TIMESTAMP NOT NULL DEFAULT NOW(),
    "responded" BOOLEAN DEFAULT false,
    "metadata" JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_social_activity_platform_timestamp" ON "social_activity"("platform", "timestamp");
CREATE INDEX IF NOT EXISTS "idx_social_activity_external_id" ON "social_activity"("external_id");
CREATE INDEX IF NOT EXISTS "idx_system_log_event_timestamp" ON "system_log"("event", "timestamp");
CREATE INDEX IF NOT EXISTS "idx_content_performance_platform_post_id" ON "content_performance"("platform_post_id");
CREATE INDEX IF NOT EXISTS "idx_ai_content_queue_status_scheduled" ON "ai_content_queue"("status", "scheduled_for");
CREATE INDEX IF NOT EXISTS "idx_trending_topic_platform_volume" ON "trending_topic"("platform", "volume");

-- Insert default content templates
INSERT INTO "content_template" ("type", "template", "frequency", "time_slots") VALUES 
('educational', '🧠 SOLess Fact: Cross-chain swaps between #Solana and #Sonic are now gasless! Trade without worrying about transaction fees. #DeFi #SOLessSwap', 2, '["09:00", "15:00"]'),
('educational', '💡 Did you know? SOUL tokens are automatically burned with every trade, making the remaining supply more scarce over time. #Tokenomics #SOUL', 2, '["09:00", "15:00"]'),
('educational', '🎯 SOLspace automatically detects viral content and mints it as NFTs. Your viral tweets could become valuable digital assets! #NFTs #ViralContent', 2, '["09:00", "15:00"]'),
('educational', '🔥 With SOLarium, your NFTs have guaranteed floor prices. No more worthless jpegs - real utility, real value. #NFTs #SOLarium', 2, '["09:00", "15:00"]'),

('engagement', 'What''s your biggest challenge with cross-chain trading? 🤔 Share below and Soulie might have the perfect solution! #CryptoProblems', 1, '["12:00", "18:00"]'),
('engagement', 'Which feature excites you most? 🚀\n\n💱 Gasless trading\n🔥 Automatic burns\n🎨 Viral NFT minting\n🏆 Engagement contests\n\nComment your choice!', 1, '["12:00", "18:00"]'),
('engagement', 'Tag someone who needs to hear about gasless cross-chain trading! 👇 #SOLessSwap #CrossChain', 1, '["12:00", "18:00"]'),
('engagement', 'What would you do if your viral tweet automatically became a valuable NFT? Tell us below! 👇 #SOLspace', 1, '["12:00", "18:00"]'),

('trending', 'While others talk about #Web3 adoption, we''re building it. Real utility, real users, real value. 🚀 #SOLess #BuildingTheNext', 1, '["10:00", "16:00", "20:00"]'),
('trending', '🌊 The future of social media is here: Your content = Your wealth. Every viral post = Valuable NFT. #SOLspace #CreatorEconomy', 1, '["10:00", "16:00", "20:00"]'),
('trending', 'Cross-chain bridges that actually work. No failed transactions, no lost funds, just seamless trading. #DeFi #CrossChain #SOLlessSwap', 1, '["10:00", "16:00", "20:00"]');

COMMENT ON TABLE "social_activity" IS 'Tracks all social media activities performed by the AI agent';
COMMENT ON TABLE "system_log" IS 'System-level events and analytics for the social AI system';
COMMENT ON TABLE "content_template" IS 'Predefined content templates with scheduling information';
COMMENT ON TABLE "social_metric" IS 'Social media metrics and KPIs tracking';
COMMENT ON TABLE "content_performance" IS 'Performance metrics for posted content';
COMMENT ON TABLE "ai_content_queue" IS 'Queue for AI-generated content to be posted';
COMMENT ON TABLE "trending_topic" IS 'Tracking of trending topics for content opportunities';
