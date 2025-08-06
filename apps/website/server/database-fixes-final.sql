-- SOLess Engagement Contest System - Database Fixes (Corrected)
-- Addresses critical issues identified in comprehensive audit
-- Date: July 25, 2025

BEGIN;

-- ========================================
-- CRITICAL FIX #1: Prevent Multiple Active Contests
-- ========================================

-- First, let's handle existing multiple active contests
-- Keep the most recent one as ACTIVE, set others to COMPLETED
DO $$
DECLARE
    latest_contest_id TEXT;
BEGIN
    -- Get the most recently created active contest
    SELECT id INTO latest_contest_id 
    FROM "Contest" 
    WHERE status = 'ACTIVE' 
    ORDER BY "createdAt" DESC 
    LIMIT 1;
    
    -- Update all other active contests to COMPLETED
    UPDATE "Contest" 
    SET status = 'COMPLETED', "updatedAt" = CURRENT_TIMESTAMP
    WHERE status = 'ACTIVE' AND id != latest_contest_id;
    
    RAISE NOTICE 'Multiple active contests resolved. Latest contest % kept as ACTIVE', latest_contest_id;
END $$;

-- Create unique constraint to prevent future multiple active contests
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_active_contest_idx 
ON "Contest" (status) 
WHERE status = 'ACTIVE';

-- ========================================
-- DATA INTEGRITY CONSTRAINTS
-- ========================================

-- Contest time validity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'contest_time_validity'
    ) THEN
        ALTER TABLE "Contest" 
        ADD CONSTRAINT contest_time_validity 
        CHECK ("endTime" > "startTime");
    END IF;
END $$;

-- User points non-negative
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_points_non_negative'
    ) THEN
        ALTER TABLE "User" 
        ADD CONSTRAINT user_points_non_negative 
        CHECK (points >= 0 AND "lifetimePoints" >= 0);
    END IF;
END $$;

-- UserStreak non-negative values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
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

-- ========================================
-- ENHANCED TRIGGERS AND FUNCTIONS
-- ========================================

-- Contest entry timestamp update trigger
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
    -- Prevent changing status of completed contests
    IF OLD.status = 'COMPLETED' AND NEW.status != 'COMPLETED' THEN
        RAISE EXCEPTION 'Cannot change status of completed contest';
    END IF;
    
    -- Ensure only one active contest exists
    IF NEW.status = 'ACTIVE' AND OLD.status != 'ACTIVE' THEN
        IF EXISTS (SELECT 1 FROM "Contest" WHERE status = 'ACTIVE' AND id != NEW.id) THEN
            RAISE EXCEPTION 'Only one contest can be active at a time';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contest_status_validation ON "Contest";
CREATE TRIGGER contest_status_validation
    BEFORE UPDATE ON "Contest"
    FOR EACH ROW
    EXECUTE FUNCTION validate_contest_status_change();

-- ========================================
-- HELPER FUNCTIONS FOR SYSTEM HEALTH
-- ========================================

-- Data consistency checker
CREATE OR REPLACE FUNCTION check_data_consistency()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: Multiple active contests
    RETURN QUERY
    SELECT 
        'Multiple Active Contests'::TEXT,
        CASE WHEN COUNT(*) <= 1 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*) || ' active contests'::TEXT
    FROM "Contest" WHERE status = 'ACTIVE';
    
    -- Check 2: Contest entry consistency
    RETURN QUERY
    SELECT 
        'Contest Entry Consistency'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*) || ' orphaned contest entries'::TEXT
    FROM "ContestEntry" ce
    LEFT JOIN "Contest" c ON ce."contestId" = c.id
    WHERE c.id IS NULL;
    
    -- Check 3: User points consistency
    RETURN QUERY
    SELECT 
        'User Points Consistency'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*) || ' users with negative points'::TEXT
    FROM "User" WHERE points < 0 OR "lifetimePoints" < 0;
    
    -- Check 4: Contest time validity
    RETURN QUERY
    SELECT 
        'Contest Time Validity'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*) || ' contests with invalid time ranges'::TEXT
    FROM "Contest" WHERE "endTime" <= "startTime";
END;
$$ LANGUAGE plpgsql;

-- Safe contest activation function
CREATE OR REPLACE FUNCTION activate_contest(contest_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    contest_exists BOOLEAN;
    current_status TEXT;
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
    UPDATE "Contest" SET status = 'COMPLETED', "updatedAt" = CURRENT_TIMESTAMP 
    WHERE status = 'ACTIVE';
    
    -- Activate the specified contest
    UPDATE "Contest" 
    SET status = 'ACTIVE', "updatedAt" = CURRENT_TIMESTAMP 
    WHERE id = contest_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Contest cleanup function
CREATE OR REPLACE FUNCTION cleanup_test_contests()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "Contest" 
    WHERE name LIKE '%Test%' OR name LIKE '%test%' OR name LIKE '%TEST%';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERFORMANCE OPTIMIZATIONS
-- ========================================

-- Contest performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Contest_status_startTime_idx" 
ON "Contest" (status, "startTime") WHERE status IN ('ACTIVE', 'UPCOMING');

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Contest_endTime_idx" 
ON "Contest" ("endTime") WHERE status = 'ACTIVE';

-- User engagement indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_lastActive_idx" 
ON "User" ("lastActive" DESC) WHERE "lastActive" IS NOT NULL;

-- ContestEntry performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ContestEntry_contestId_points_idx" 
ON "ContestEntry" ("contestId", points DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ContestEntry_userId_contestId_idx" 
ON "ContestEntry" ("userId", "contestId");

-- Engagement tracking indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Engagement_userId_platform_createdAt_idx" 
ON "Engagement" ("userId", platform, "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Engagement_createdAt_idx" 
ON "Engagement" ("createdAt") WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days';

COMMIT;

-- ========================================
-- VERIFICATION
-- ========================================

DO $$
BEGIN
    RAISE NOTICE 'SOLess Engagement Contest System database fixes applied successfully!';
    RAISE NOTICE 'Run SELECT * FROM check_data_consistency(); to verify system health.';
END $$;
