-- Database fixes for SOLess Engagement Contest System
-- Apply these changes to ensure data integrity and system reliability

-- 1. Add unique constraint to prevent multiple active contests
-- This addresses the critical issue found in the audit
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_active_contest' 
        AND table_name = 'Contest'
    ) THEN
        -- Create a unique partial index for active contests
        CREATE UNIQUE INDEX CONCURRENTLY unique_active_contest_idx 
        ON "Contest" (status) 
        WHERE status = 'ACTIVE';
        
        -- Add the constraint
        ALTER TABLE "Contest" 
        ADD CONSTRAINT unique_active_contest 
        EXCLUDE USING btree (status WITH =) 
        WHERE (status = 'ACTIVE');
    END IF;
END $$;

-- 2. Enhance indexes for better performance
-- These indexes were identified as missing during the audit

-- Index for engagement queries by user, platform, and type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_engagement_user_platform_type_timestamp
ON "Engagement" (userId, platform, type, timestamp DESC);

-- Index for contest entries leaderboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contest_entry_contest_points_rank
ON "ContestEntry" (contestId, points DESC, rank ASC);

-- Index for reward claims and status checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contest_reward_user_status
ON "ContestReward" (userId, status, expiresAt);

-- Index for point transactions by user and timestamp
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_point_transaction_user_timestamp
ON "PointTransaction" (userId, timestamp DESC);

-- Index for user streaks lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_streak_user_id
ON "UserStreak" (userId);

-- 3. Add check constraints for data validation
-- These ensure data integrity at the database level

-- Ensure contest end time is after start time
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'contest_time_validity'
    ) THEN
        ALTER TABLE "Contest" 
        ADD CONSTRAINT contest_time_validity 
        CHECK (endTime > startTime);
    END IF;
END $$;

-- Ensure points are non-negative
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_points_non_negative'
    ) THEN
        ALTER TABLE "User" 
        ADD CONSTRAINT user_points_non_negative 
        CHECK (points >= 0 AND lifetimePoints >= 0);
    END IF;
END $$;

-- Ensure contest entry points are non-negative
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

-- Ensure streak values are non-negative
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_streak_non_negative'
    ) THEN
        ALTER TABLE "UserStreak" 
        ADD CONSTRAINT user_streak_non_negative 
        CHECK (
            telegramStreak >= 0 AND 
            discordStreak >= 0 AND 
            twitterStreak >= 0
        );
    END IF;
END $$;

-- 4. Add trigger to automatically update contest entry timestamps
-- This ensures proper audit trail for contest activities

CREATE OR REPLACE FUNCTION update_contest_entry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS contest_entry_update_timestamp ON "ContestEntry";
CREATE TRIGGER contest_entry_update_timestamp
    BEFORE UPDATE ON "ContestEntry"
    FOR EACH ROW
    EXECUTE FUNCTION update_contest_entry_timestamp();

-- 5. Add function to validate contest state transitions
-- This prevents invalid contest status changes

CREATE OR REPLACE FUNCTION validate_contest_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow any transition if it's a new record
    IF TG_OP = 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Validate status transitions
    IF OLD.status = 'ACTIVE' AND NEW.status NOT IN ('COMPLETED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid contest status transition from ACTIVE to %', NEW.status;
    END IF;
    
    IF OLD.status = 'COMPLETED' AND NEW.status != 'COMPLETED' THEN
        RAISE EXCEPTION 'Cannot change status of completed contest';
    END IF;
    
    IF OLD.status = 'CANCELLED' AND NEW.status != 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot change status of cancelled contest';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS contest_status_validation ON "Contest";
CREATE TRIGGER contest_status_validation
    BEFORE UPDATE ON "Contest"
    FOR EACH ROW
    EXECUTE FUNCTION validate_contest_status_transition();

-- 6. Create view for contest leaderboard (performance optimization)
CREATE OR REPLACE VIEW contest_leaderboard AS
SELECT 
    ce.contestId,
    ce.userId,
    u.wallet,
    u.telegramUsername,
    u.discordUsername,
    u.twitterUsername,
    ce.points,
    ce.rank,
    ce.qualifiedAt,
    ce.updatedAt
FROM "ContestEntry" ce
JOIN "User" u ON ce.userId = u.id
ORDER BY ce.contestId, ce.points DESC, ce.updatedAt ASC;

-- 7. Create function to safely start a new contest
-- This ensures only one active contest exists at a time

CREATE OR REPLACE FUNCTION start_new_contest(
    contest_name TEXT,
    contest_description TEXT DEFAULT NULL,
    end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    contest_rules JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_contest_id UUID;
    calculated_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate end time if not provided (default to 7 days)
    calculated_end_time := COALESCE(end_time, CURRENT_TIMESTAMP + INTERVAL '7 days');
    
    -- Validate end time is in the future
    IF calculated_end_time <= CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'Contest end time must be in the future';
    END IF;
    
    -- End any currently active contests
    UPDATE "Contest" 
    SET status = 'COMPLETED', updatedAt = CURRENT_TIMESTAMP
    WHERE status = 'ACTIVE';
    
    -- Create new contest
    INSERT INTO "Contest" (
        name, 
        description, 
        startTime, 
        endTime, 
        status, 
        rules,
        createdAt,
        updatedAt
    ) VALUES (
        contest_name,
        contest_description,
        CURRENT_TIMESTAMP,
        calculated_end_time,
        'ACTIVE',
        contest_rules,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO new_contest_id;
    
    RETURN new_contest_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to safely end a contest
CREATE OR REPLACE FUNCTION end_contest(contest_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    contest_exists BOOLEAN;
BEGIN
    -- Check if contest exists and is active
    SELECT EXISTS(
        SELECT 1 FROM "Contest" 
        WHERE id = contest_id AND status = 'ACTIVE'
    ) INTO contest_exists;
    
    IF NOT contest_exists THEN
        RAISE EXCEPTION 'Contest not found or not active';
    END IF;
    
    -- Update contest status
    UPDATE "Contest" 
    SET 
        status = 'COMPLETED',
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = contest_id;
    
    -- Update all contest entries with final timestamps
    UPDATE "ContestEntry"
    SET 
        qualifiedAt = COALESCE(qualifiedAt, CURRENT_TIMESTAMP),
        updatedAt = CURRENT_TIMESTAMP
    WHERE contestId = contest_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. Add data consistency check function
-- This helps identify and fix data inconsistencies

CREATE OR REPLACE FUNCTION check_data_consistency()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: Users with negative points
    RETURN QUERY
    SELECT 
        'negative_points'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Users with negative points: ' || COUNT(*)::TEXT
    FROM "User" 
    WHERE points < 0 OR lifetimePoints < 0;
    
    -- Check 2: Contest entries without matching contests
    RETURN QUERY
    SELECT 
        'orphaned_contest_entries'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Orphaned contest entries: ' || COUNT(*)::TEXT
    FROM "ContestEntry" ce
    LEFT JOIN "Contest" c ON ce.contestId = c.id
    WHERE c.id IS NULL;
    
    -- Check 3: Multiple active contests
    RETURN QUERY
    SELECT 
        'multiple_active_contests'::TEXT,
        CASE WHEN COUNT(*) <= 1 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Active contests count: ' || COUNT(*)::TEXT
    FROM "Contest" 
    WHERE status = 'ACTIVE';
    
    -- Check 4: Point transaction consistency
    RETURN QUERY
    WITH user_point_sums AS (
        SELECT 
            pt.userId,
            SUM(pt.amount) as transaction_total,
            u.points as user_points
        FROM "PointTransaction" pt
        JOIN "User" u ON pt.userId = u.id
        GROUP BY pt.userId, u.points
    )
    SELECT 
        'point_consistency'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Users with point discrepancies: ' || COUNT(*)::TEXT
    FROM user_point_sums
    WHERE ABS(transaction_total - user_points) > 10; -- Allow small discrepancy
    
END;
$$ LANGUAGE plpgsql;

-- 10. Create indexes for audit and monitoring queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_engagement_timestamp_platform
ON "Engagement" (timestamp DESC, platform);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_last_active
ON "User" (lastActive DESC) WHERE lastActive IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contest_status_dates
ON "Contest" (status, startTime, endTime);

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT EXECUTE ON FUNCTION start_new_contest(TEXT, TEXT, TIMESTAMP WITH TIME ZONE, JSONB) TO your_app_user;
-- GRANT EXECUTE ON FUNCTION end_contest(UUID) TO your_app_user;
-- GRANT EXECUTE ON FUNCTION check_data_consistency() TO your_app_user;

-- Final message
DO $$
BEGIN
    RAISE NOTICE 'SOLess Engagement Contest System database fixes applied successfully!';
    RAISE NOTICE 'Run SELECT * FROM check_data_consistency(); to verify system health.';
END $$;
