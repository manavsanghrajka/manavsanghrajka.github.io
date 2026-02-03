-- Add admin users table to track admin status
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT UNIQUE NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Create a default admin account (update the email as needed)
-- The user must first register through normal signup, then add them here
-- INSERT INTO admin_users (user_id, email) VALUES ('your-user-id', 'admin@example.com');
