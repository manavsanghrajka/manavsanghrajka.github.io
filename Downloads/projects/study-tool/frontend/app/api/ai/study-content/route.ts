import { createClient } from '@/lib/supabase/server'
import { generateStudyContent } from '@/lib/gemini'
import { NextResponse } from 'next/server'

// POST /api/ai/study-content - Generate study content using Gemini AI
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { topicName, courseName } = await request.json()
    
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
    
    // Generate study content using Gemini
    const content = await generateStudyContent(topicName, courseName)
    
    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('Error generating study content:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate study content' },
      { status: 500 }
    )
  }
}
