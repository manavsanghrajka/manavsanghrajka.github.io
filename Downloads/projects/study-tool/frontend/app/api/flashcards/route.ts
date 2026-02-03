import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/flashcards - Get due flashcards for a topic
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }

    // Call RPC to get due flashcards
    const { data, error } = await supabase.rpc('get_due_flashcards', {
      p_user_id: user.id,
      p_topic_id: topicId,
      p_limit: 20
    });

    if (error) {
      console.error('Error fetching due flashcards:', error);
      return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
    }

    return NextResponse.json({ flashcards: data || [] });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/flashcards/review - Record flashcard review result
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { flashcardId, isCorrect } = body;

    if (!flashcardId || isCorrect === undefined) {
      return NextResponse.json({ error: 'flashcardId and isCorrect are required' }, { status: 400 });
    }

    // Call RPC to update Leitner box
    const { data, error } = await supabase.rpc('review_flashcard', {
      p_flashcard_id: flashcardId,
      p_user_id: user.id,
      p_is_correct: isCorrect
    });

    if (error) {
      console.error('Error reviewing flashcard:', error);
      return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
