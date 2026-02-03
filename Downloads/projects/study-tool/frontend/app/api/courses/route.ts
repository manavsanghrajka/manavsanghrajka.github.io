import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/courses - Get courses visible to the current user
// Returns: user's private courses + all global courses
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    let query = supabase
      .from('Exam')
      .select('id, name, description, userId')
      .order('name')
    
    if (user) {
      // Logged in: show user's private courses + global courses
      query = query.or(`userId.eq.${user.id},userId.is.null`)
    } else {
      // Not logged in: show only global courses
      query = query.is('userId', null)
    }
    
    const { data: courses, error } = await query
    
    if (error) throw error
    
    // Add isPrivate flag to each course for frontend display
    const coursesWithVisibility = (courses || []).map(course => ({
      ...course,
      isPrivate: course.userId !== null,
      isOwner: user && course.userId === user.id
    }))
    
    return NextResponse.json({ courses: coursesWithVisibility })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// POST /api/courses - Create a new course
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { name, description, isPrivate } = await request.json()
    
    if (!name) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      )
    }
    
    // Set userId for private courses, null for global
    const courseUserId = isPrivate ? user.id : null
    
    const { data: course, error } = await supabase
      .from('Exam')
      .insert({ 
        name, 
        description: description || null,
        userId: courseUserId
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ course })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create course' },
      { status: 500 }
    )
  }
}
