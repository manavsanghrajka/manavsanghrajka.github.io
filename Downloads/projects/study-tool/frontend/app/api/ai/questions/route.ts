import { createClient } from '@/lib/supabase/server'
import { generatePracticeQuestions, VibePesona } from '@/lib/gemini'
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

// POST /api/ai/questions - Generate practice questions using Gemini AI
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { topicName, courseName, count = 5 } = await request.json()
    
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
    
    // Generate practice questions using Gemini with user's vibe
    const questions = await generatePracticeQuestions(topicName, courseName, count, userVibe)
    
    return NextResponse.json({ 
      questions,
      vibe: userVibe
    })
  } catch (error: any) {
    console.error('Error generating practice questions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate practice questions' },
      { status: 500 }
    )
  }
}
