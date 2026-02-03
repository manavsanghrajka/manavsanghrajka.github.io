import { createClient } from '@/lib/supabase/server';
import { generateRemediationFlashcards, VibePesona } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';

// Helper to get user's vibe preference
async function getUserVibe(supabase: any, userId: string): Promise<VibePesona> {
  const { data } = await supabase
    .from('User')
    .select('vibe_persona')
    .eq('id', userId)
    .single();
  
  return (data?.vibe_persona as VibePesona) || 'professional';
}

// GET /api/remediation - Get pending remediation items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get pending remediation items
    const { data, error } = await supabase
      .from('remediation_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching remediation queue:', error);
      return NextResponse.json({ error: 'Failed to fetch remediation queue' }, { status: 500 });
    }

    return NextResponse.json({ 
      items: data || [],
      count: data?.length || 0
    });
  } catch (error: any) {
    console.error('Error in remediation GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/remediation - Add failed quiz question to remediation queue
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      topicId, 
      topicName, 
      quizId, 
      question, 
      wrongAnswer, 
      correctAnswer,
      autoGenerateFlashcards = true 
    } = body;

    if (!topicName || !question) {
      return NextResponse.json({ 
        error: 'topicName and question are required' 
      }, { status: 400 });
    }

    // Add to remediation queue
    const { data: remediationItem, error: insertError } = await supabase
      .from('remediation_queue')
      .insert({
        user_id: user.id,
        topic_id: topicId,
        topic_name: topicName,
        source_quiz_id: quizId,
        question_text: question,
        wrong_answer: wrongAnswer,
        correct_answer: correctAnswer,
        status: 'pending',
        priority: 1
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding to remediation queue:', insertError);
      return NextResponse.json({ error: 'Failed to add to queue' }, { status: 500 });
    }

    let flashcards = null;

    // Auto-generate "Why You Were Wrong" flashcards
    if (autoGenerateFlashcards && process.env.GEMINI_API_KEY) {
      try {
        const userVibe = await getUserVibe(supabase, user.id);
        flashcards = await generateRemediationFlashcards(
          question,
          wrongAnswer,
          correctAnswer,
          topicName,
          userVibe
        );

        // Save flashcards to database
        if (flashcards && flashcards.length > 0 && topicId) {
          for (const card of flashcards) {
            await supabase
              .from('Flashcard')
              .insert({
                topicId: topicId,
                front: card.front,
                back: card.back
              });
          }
        }

        // Update remediation status
        await supabase
          .from('remediation_queue')
          .update({ status: 'flashcard_created' })
          .eq('id', remediationItem.id);

      } catch (aiError) {
        console.error('Error generating remediation flashcards:', aiError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      remediation: remediationItem,
      flashcards: flashcards,
      flashcardsGenerated: flashcards?.length || 0
    });
  } catch (error: any) {
    console.error('Error in remediation POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/remediation - Update remediation item status or clear it
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, status } = body;

    if (!itemId || !status) {
      return NextResponse.json({ 
        error: 'itemId and status are required' 
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'flashcard_created', 'audio_queued', 'cleared'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    const updates: Record<string, any> = { status };
    if (status === 'cleared') {
      updates.cleared_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('remediation_queue')
      .update(updates)
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating remediation item:', error);
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: data
    });
  } catch (error: any) {
    console.error('Error in remediation PATCH:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
