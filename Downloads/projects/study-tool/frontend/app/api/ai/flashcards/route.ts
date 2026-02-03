import { createClient } from '@/lib/supabase/server'
import { generateFlashcards, VibePesona } from '@/lib/gemini'
import { NextResponse } from 'next/server'

// Helper to get user's vibe preference
async function getUserVibe(supabase: any, userId: string): Promise<VibePesona> {
  const { data } = await supabase
    .from('User')
    .select('vibe_persona')
    .eq('id', userId)
    .single();
  
  return (data?.vibe_persona as VibePesona) || 'professional';
}

// POST /api/ai/flashcards - Generate flashcards using Gemini AI
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { topicName, courseName, topicId, count = 10 } = await request.json()
    
    if (!topicName || !courseName) {
      return NextResponse.json(
        { error: 'topicName and courseName are required' },
        { status: 400 }
      )
    }
    
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }
    
    // Get user's vibe preference
    const userVibe = await getUserVibe(supabase, user.id);
    
    // Generate flashcards using Gemini with user's vibe
    const flashcards = await generateFlashcards(topicName, courseName, count, userVibe)
    
    // Optionally save to database if topicId is provided
    if (topicId) {
      for (const card of flashcards) {
        await supabase
          .from('flashcards')
          .insert({
            topic_id: topicId,
            front: card.front,
            back: card.back
          })
      }
    }
    
    return NextResponse.json({ 
      flashcards,
      generated: flashcards.length,
      saved: topicId ? true : false,
      vibe: userVibe
    })
  } catch (error: any) {
    console.error('Error generating flashcards:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate flashcards' },
      { status: 500 }
    )
  }
}
