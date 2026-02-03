-- Leitner Flashcard System Migration
-- Run this in Supabase SQL Editor

-- Add Leitner columns to existing Flashcard table
ALTER TABLE "Flashcard" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Flashcard" ADD COLUMN IF NOT EXISTS "leitner_box" INTEGER DEFAULT 1;
ALTER TABLE "Flashcard" ADD COLUMN IF NOT EXISTS "next_review_date" DATE DEFAULT CURRENT_DATE;
ALTER TABLE "Flashcard" ADD COLUMN IF NOT EXISTS "review_count" INTEGER DEFAULT 0;
ALTER TABLE "Flashcard" ADD COLUMN IF NOT EXISTS "correct_count" INTEGER DEFAULT 0;

-- Create indexes for Leitner queries
CREATE INDEX IF NOT EXISTS idx_flashcard_user_id ON "Flashcard"("userId");
CREATE INDEX IF NOT EXISTS idx_flashcard_leitner_box ON "Flashcard"("leitner_box");
CREATE INDEX IF NOT EXISTS idx_flashcard_next_review ON "Flashcard"("next_review_date");

-- Leitner Box Review Intervals (in days):
-- Box 1: Every day (1)
-- Box 2: Every 2 days
-- Box 3: Every 4 days
-- Box 4: Every 8 days  
-- Box 5: Every 16 days

-- RPC: Record flashcard review and update Leitner box
CREATE OR REPLACE FUNCTION review_flashcard(
    p_flashcard_id TEXT,
    p_user_id TEXT,
    p_is_correct BOOLEAN
)
RETURNS JSON AS $$
DECLARE
    current_box INT;
    new_box INT;
    review_interval INT;
    new_review_date DATE;
BEGIN
    -- Get current box
    SELECT leitner_box INTO current_box 
    FROM "Flashcard" 
    WHERE id = p_flashcard_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Flashcard not found');
    END IF;
    
    -- Calculate new box based on correctness
    IF p_is_correct THEN
        -- Move up one box (max 5)
        new_box := LEAST(current_box + 1, 5);
    ELSE
        -- Reset to box 1
        new_box := 1;
    END IF;
    
    -- Calculate review interval based on new box
    CASE new_box
        WHEN 1 THEN review_interval := 1;
        WHEN 2 THEN review_interval := 2;
        WHEN 3 THEN review_interval := 4;
        WHEN 4 THEN review_interval := 8;
        WHEN 5 THEN review_interval := 16;
        ELSE review_interval := 1;
    END CASE;
    
    new_review_date := CURRENT_DATE + review_interval;
    
    -- Update flashcard
    UPDATE "Flashcard"
    SET 
        leitner_box = new_box,
        next_review_date = new_review_date,
        review_count = review_count + 1,
        correct_count = correct_count + (CASE WHEN p_is_correct THEN 1 ELSE 0 END),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = p_flashcard_id;
    
    -- Record in FlashcardResult
    INSERT INTO "FlashcardResult" ("userId", "flashcardId", "isCorrect")
    VALUES (p_user_id, p_flashcard_id, p_is_correct);
    
    RETURN json_build_object(
        'flashcard_id', p_flashcard_id,
        'previous_box', current_box,
        'new_box', new_box,
        'next_review_date', new_review_date,
        'is_correct', p_is_correct
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get flashcards due for review
CREATE OR REPLACE FUNCTION get_due_flashcards(
    p_user_id TEXT,
    p_topic_id TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20
)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(row_to_json(f))
        FROM (
            SELECT id, "topicId", front, back, leitner_box, next_review_date, review_count
            FROM "Flashcard"
            WHERE (
                "userId" = p_user_id OR "userId" IS NULL
            )
            AND next_review_date <= CURRENT_DATE
            AND (p_topic_id IS NULL OR "topicId" = p_topic_id)
            ORDER BY leitner_box ASC, next_review_date ASC
            LIMIT p_limit
        ) f
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get flashcard statistics for a user
CREATE OR REPLACE FUNCTION get_flashcard_stats(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
    total_cards INT;
    due_today INT;
    mastered_cards INT;
    box_distribution JSON;
BEGIN
    -- Total cards
    SELECT COUNT(*) INTO total_cards
    FROM "Flashcard"
    WHERE "userId" = p_user_id OR "userId" IS NULL;
    
    -- Due today
    SELECT COUNT(*) INTO due_today
    FROM "Flashcard"
    WHERE ("userId" = p_user_id OR "userId" IS NULL)
    AND next_review_date <= CURRENT_DATE;
    
    -- Mastered (box 5)
    SELECT COUNT(*) INTO mastered_cards
    FROM "Flashcard"
    WHERE ("userId" = p_user_id OR "userId" IS NULL)
    AND leitner_box = 5;
    
    -- Distribution by box
    SELECT json_agg(row_to_json(d))
    INTO box_distribution
    FROM (
        SELECT leitner_box as box, COUNT(*) as count
        FROM "Flashcard"
        WHERE "userId" = p_user_id OR "userId" IS NULL
        GROUP BY leitner_box
        ORDER BY leitner_box
    ) d;
    
    RETURN json_build_object(
        'total_cards', total_cards,
        'due_today', due_today,
        'mastered_cards', mastered_cards,
        'box_distribution', box_distribution
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
