-- Run this once against an existing PostgreSQL/Supabase database.
-- Fresh databases created from the SQLAlchemy models already include owner_id.

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS owner_id INTEGER;

CREATE INDEX IF NOT EXISTS ix_investors_owner_id
ON investors (owner_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.constraint_schema = kcu.constraint_schema
        WHERE tc.table_name = 'investors'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'owner_id'
    ) THEN
        ALTER TABLE investors
        ADD CONSTRAINT fk_investors_owner_id_users
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Legacy investors intentionally remain ownerless and are hidden by all
-- tenant-scoped application queries. Assign each legacy row to its real owner:
--
-- UPDATE investors SET owner_id = <founder_user_id> WHERE id IN (...);
--
-- After every row has the correct owner, enforce the invariant:
--
-- ALTER TABLE investors ALTER COLUMN owner_id SET NOT NULL;
