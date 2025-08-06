-- Update user points from point history
UPDATE "User" u
SET "points" = COALESCE((
  SELECT SUM(ph.points)
  FROM "PointHistory" ph
  WHERE ph."userId" = u.id
), 0);

-- Update lifetime points the same way
UPDATE "User" u
SET "lifetimePoints" = COALESCE((
  SELECT SUM(ph.points)
  FROM "PointHistory" ph
  WHERE ph."userId" = u.id
), 0);
