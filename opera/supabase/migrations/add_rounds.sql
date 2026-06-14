-- Add 'rounds' column to 'sessions' table
ALTER TABLE sessions ADD COLUMN rounds INT DEFAULT 1;

-- Add 'round_number' column to 'council_debates' table
ALTER TABLE council_debates ADD COLUMN round_number INT DEFAULT 1;
