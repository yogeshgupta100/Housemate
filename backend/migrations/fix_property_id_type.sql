-- First, create a temporary column for user_id
ALTER TABLE properties ADD COLUMN temp_user_id integer;
ALTER TABLE properties ADD COLUMN temp_created_by integer;

-- Get the admin user ID (assuming it's 1)
DO $$
DECLARE
    admin_id integer := 1;
BEGIN
    -- Update the temporary columns with converted values, using admin_id as default
    UPDATE properties 
    SET temp_user_id = COALESCE(
        (SELECT id FROM users WHERE users.id::text = properties.user_id::text),
        admin_id
    );
    
    UPDATE properties 
    SET temp_created_by = COALESCE(
        (SELECT id FROM users WHERE users.id::text = properties.created_by::text),
        admin_id
    );
END $$;

-- Drop the old UUID columns
ALTER TABLE properties DROP COLUMN user_id;
ALTER TABLE properties DROP COLUMN created_by;

-- Rename the temporary columns
ALTER TABLE properties RENAME COLUMN temp_user_id TO user_id;
ALTER TABLE properties RENAME COLUMN temp_created_by TO created_by;

-- Add NOT NULL constraints
ALTER TABLE properties ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE properties ALTER COLUMN created_by SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE properties ADD CONSTRAINT fk_properties_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE properties ADD CONSTRAINT fk_properties_created_by FOREIGN KEY (created_by) REFERENCES users(id);

-- Reset the sequence to start from the highest existing ID
SELECT setval('properties_id_seq', (SELECT MAX(id) FROM properties)); 