import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/flashcards/result - Record a flashcard result
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { flashcardId, isCorrect } = await request.json()
    
    if (!flashcardId || isCorrect === undefined) {
      return NextResponse.json(
        { error: 'flashcardId and isCorrect are required' },
        { status: 400 }
      )
    }
    
    const { data: result, error } = await supabase
      .from('flashcard_results')
      .insert({
        user_id: user.id,
        flashcard_id: flashcardId,
        is_correct: isCorrect,
        reviewed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ result })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save result' },
      { status: 500 }
    )
  }
}
