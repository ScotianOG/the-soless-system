-- SOLess Engagement Contest System - Database Fixes (Corrected)
-- Priority: Critical - Apply immediately for production readiness
-- Date: 2025-07-23

-- Begin transaction for atomic application
BEGIN;

-- =============================================================================
-- 1. CRITICAL: Prevent Multiple Active Contests
-- =============================================================================

-- First, check if we have multiple active contests and handle them
DO $$
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_count FROM "Contest" WHERE status = 'ACTIVE';
    
    IF active_count > 1 THEN
        RAISE NOTICE 'Found % active contests. Keeping the most recent one.', active_count;
        
        -- Keep only the most recent active contest, set others to COMPLETED
        UPDATE "Contest" 
        SET status = 'COMPLETED'
        WHERE status = 'ACTIVE' 
        AND id NOT IN (
            SELECT id FROM "Contest" 
            WHERE status = 'ACTIVE' 
            ORDER BY "createdAt" DESC 
            LIMIT 1
        );
    END IF;
END $$;

-- Create unique constraint to prevent multiple active contests
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_contest_idx 
ON "Contest" (status) 
WHERE status = 'ACTIVE';

-- =============================================================================
-- 2. DATA INTEGRITY CONSTRAINTS
-- =============================================================================

-- Contest time validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'contest_time_validity'
    ) THEN
        ALTER TABLE "Contest" 
        ADD CONSTRAINT contest_time_validity 
        CHECK ("endTime" > "startTime");
    END IF;
END $$;

-- User points validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_points_non_negative'
    ) THEN
        ALTER TABLE "User" 
        ADD CONSTRAINT user_points_non_negative 
        CHECK (points >= 0 AND "lifetimePoints" >= 0);
    END IF;
END $$;

-- Contest entry points validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'contest_entry_points_non_negative'
    ) THEN
        ALTER TABLE "ContestEntry" 
        ADD CONSTRAINT contest_entry_points_non_negative 
        CHECK (points >= 0);
    END IF;
END $$;

-- User streak validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_streak_non_negative'
    ) THEN
        ALTER TABLE "UserStreak" 
        ADD CONSTRAINT user_streak_non_negative 
        CHECK (
            "telegramStreak" >= 0 AND 
            "discordStreak" >= 0 AND 
            "twitterStreak" >= 0
        );
    END IF;
END $$;

-- =============================================================================
-- 3. ENHANCED TRIGGERS FOR DATA CONSISTENCY
-- =============================================================================

-- Contest entry timestamp trigger
CREATE OR REPLACE FUNCTION update_contest_entry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contest_entry_update_timestamp ON "ContestEntry";
CREATE TRIGGER contest_entry_update_timestamp
    BEFORE UPDATE ON "ContestEntry"
    FOR EACH ROW
    EXECUTE FUNCTION update_contest_entry_timestamp();

-- Contest status validation trigger
CREATE OR REPLACE FUNCTION validate_contest_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent changing status from COMPLETED back to ACTIVE
    IF OLD.status = 'COMPLETED' AND NEW.status = 'ACTIVE' THEN
        RAISE EXCEPTION 'Cannot reactivate a completed contest';
    END IF;
    
    -- Ensure contest is not ended before it starts
    IF NEW."endTime" <= NEW."startTime" THEN
        RAISE EXCEPTION 'Contest end time must be after start time';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contest_status_validation ON "Contest";
CREATE TRIGGER contest_status_validation
    BEFORE UPDATE ON "Contest"
    FOR EACH ROW
    EXECUTE FUNCTION validate_contest_status_change();

-- =============================================================================
-- 4. HELPER FUNCTIONS FOR SAFE OPERATIONS
-- =============================================================================

-- Function to safely activate a contest (ensures only one active)
CREATE OR REPLACE FUNCTION activate_contest(contest_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    contest_exists BOOLEAN;
    current_status "ContestStatus";
BEGIN
    -- Check if contest exists and get current status
    SELECT EXISTS(SELECT 1 FROM "Contest" WHERE id = contest_id), status
    INTO contest_exists, current_status
    FROM "Contest" WHERE id = contest_id;
    
    IF NOT contest_exists THEN
        RAISE EXCEPTION 'Contest with id % does not exist', contest_id;
    END IF;
    
    IF current_status = 'ACTIVE' THEN
        RETURN TRUE; -- Already active
    END IF;
    
    -- Deactivate any currently active contests
    UPDATE "Contest" SET status = 'COMPLETED' WHERE status = 'ACTIVE';
    
    -- Activate the requested contest
    UPDATE "Contest" SET status = 'ACTIVE', "updatedAt" = CURRENT_TIMESTAMP 
    WHERE id = contest_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to safely get contest leaderboard
CREATE OR REPLACE FUNCTION get_contest_leaderboard(contest_id TEXT, limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    user_id TEXT,
    username TEXT,
    points INTEGER,
    rank_position BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce."userId",
        u.username,
        ce.points,
        ROW_NUMBER() OVER (ORDER BY ce.points DESC, ce."updatedAt" ASC) as rank_position
    FROM "ContestEntry" ce
    JOIN "User" u ON ce."userId" = u.id
    WHERE ce."contestId" = contest_id
    ORDER BY ce.points DESC, ce."updatedAt" ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check data consistency
CREATE OR REPLACE FUNCTION check_data_consistency()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check for multiple active contests
    RETURN QUERY
    SELECT 
        'Multiple Active Contests'::TEXT,
        CASE WHEN COUNT(*) > 1 THEN 'FAIL' ELSE 'PASS' END::TEXT,
        'Found ' || COUNT(*) || ' active contests'::TEXT
    FROM "Contest" WHERE status = 'ACTIVE';
    
    -- Check for negative points
    RETURN QUERY
    SELECT 
        'Negative User Points'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END::TEXT,
        'Found ' || COUNT(*) || ' users with negative points'::TEXT
    FROM "User" WHERE points < 0 OR "lifetimePoints" < 0;
    
    -- Check for invalid contest times
    RETURN QUERY
    SELECT 
        'Invalid Contest Times'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END::TEXT,
        'Found ' || COUNT(*) || ' contests with invalid time ranges'::TEXT
    FROM "Contest" WHERE "endTime" <= "startTime";
    
    -- Check for orphaned contest entries
    RETURN QUERY
    SELECT 
        'Orphaned Contest Entries'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END::TEXT,
        'Found ' || COUNT(*) || ' contest entries without valid users'::TEXT
    FROM "ContestEntry" ce
    LEFT JOIN "User" u ON ce."userId" = u.id
    WHERE u.id IS NULL;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. PERFORMANCE INDEXES
-- =============================================================================

-- Contest entry performance indexes
CREATE INDEX IF NOT EXISTS contest_entry_user_contest_idx 
ON "ContestEntry" ("userId", "contestId");

CREATE INDEX IF NOT EXISTS contest_entry_points_desc_idx 
ON "ContestEntry" (points DESC);

-- User performance indexes
CREATE INDEX IF NOT EXISTS user_points_desc_idx 
ON "User" (points DESC);

CREATE INDEX IF NOT EXISTS user_last_active_idx 
ON "User" ("lastActive" DESC) WHERE "lastActive" IS NOT NULL;

-- Contest timing index
CREATE INDEX IF NOT EXISTS contest_time_range_idx 
ON "Contest" ("startTime", "endTime") WHERE status = 'ACTIVE';

-- Engagement tracking indexes
CREATE INDEX IF NOT EXISTS engagement_user_platform_idx 
ON "Engagement" ("userId", platform);

CREATE INDEX IF NOT EXISTS engagement_created_at_idx 
ON "Engagement" ("createdAt" DESC);

-- Commit all changes
COMMIT;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'SOLess Engagement Contest System database fixes applied successfully!';
    RAISE NOTICE 'Run SELECT * FROM check_data_consistency(); to verify system health.';
END $$;
