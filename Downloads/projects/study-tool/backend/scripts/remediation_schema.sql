-- Remediation Queue Schema
-- Run this in your Supabase SQL Editor

-- Create the remediation queue table
CREATE TABLE IF NOT EXISTS "remediation_queue" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "topic_id" TEXT REFERENCES "Topic"("id") ON DELETE SET NULL,
    "topic_name" TEXT NOT NULL,
    "source_quiz_id" TEXT,
    "question_text" TEXT,
    "wrong_answer" TEXT,
    "correct_answer" TEXT,
    "status" TEXT DEFAULT 'pending', -- 'pending', 'flashcard_created', 'audio_queued', 'cleared'
    "priority" INTEGER DEFAULT 1, -- Higher = more urgent
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "cleared_at" TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_remediation_user_id ON remediation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_remediation_status ON remediation_queue(status);
CREATE INDEX IF NOT EXISTS idx_remediation_topic_id ON remediation_queue(topic_id);

-- RPC: Add item to remediation queue
CREATE OR REPLACE FUNCTION add_to_remediation_queue(
    p_user_id TEXT,
    p_topic_id TEXT,
    p_topic_name TEXT,
    p_quiz_id TEXT,
    p_question TEXT,
    p_wrong_answer TEXT,
    p_correct_answer TEXT
)
RETURNS JSON AS $$
DECLARE
    new_id TEXT;
BEGIN
    INSERT INTO remediation_queue (
        user_id, topic_id, topic_name, source_quiz_id, 
        question_text, wrong_answer, correct_answer
    ) VALUES (
        p_user_id, p_topic_id, p_topic_name, p_quiz_id,
        p_question, p_wrong_answer, p_correct_answer
    )
    RETURNING id INTO new_id;
    
    RETURN json_build_object('id', new_id, 'success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get pending remediation items for a user
CREATE OR REPLACE FUNCTION get_pending_remediation(p_user_id TEXT, p_limit INT DEFAULT 10)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(row_to_json(r))
        FROM (
            SELECT id, topic_id, topic_name, question_text, wrong_answer, 
                   correct_answer, status, priority, created_at
            FROM remediation_queue
            WHERE user_id = p_user_id AND status = 'pending'
            ORDER BY priority DESC, created_at DESC
            LIMIT p_limit
        ) r
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Mark remediation item as cleared
CREATE OR REPLACE FUNCTION clear_remediation(p_item_id TEXT, p_user_id TEXT)
RETURNS JSON AS $$
BEGIN
    UPDATE remediation_queue 
    SET status = 'cleared', cleared_at = CURRENT_TIMESTAMP
    WHERE id = p_item_id AND user_id = p_user_id;
    
    RETURN json_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Update remediation status (for flashcard/audio creation)
CREATE OR REPLACE FUNCTION update_remediation_status(p_item_id TEXT, p_status TEXT)
RETURNS JSON AS $$
BEGIN
    UPDATE remediation_queue 
    SET status = p_status
    WHERE id = p_item_id;
    
    RETURN json_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
