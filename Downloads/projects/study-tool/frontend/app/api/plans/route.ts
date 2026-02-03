import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/plans - Get all study plans for current user
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: plans, error } = await supabase
      .from('StudyPlan')
      .select(`
        id,
        examDate,
        minutesPerDay,
        createdAt,
        Exam (
          id,
          name,
          description
        )
      `)
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
    
    if (error) throw error
    
    // Transform to expected format
    const formattedPlans = (plans || []).map(plan => ({
      id: plan.id,
      examName: (plan.Exam as any)?.name || 'Unknown',
      examDate: plan.examDate,
      minutesPerDay: plan.minutesPerDay,
      createdAt: plan.createdAt
    }))
    
    return NextResponse.json({ plans: formattedPlans })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

// POST /api/plans - Create a new study plan
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { examId, examDate, minutesPerDay } = await request.json()
    
    if (!examId || !examDate || !minutesPerDay) {
      return NextResponse.json(
        { error: 'examId, examDate, and minutesPerDay are required' },
        { status: 400 }
      )
    }
    
    const targetDate = new Date(examDate)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid exam date' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for User sync
    const adminSupabase = createAdminClient()
    
    // Check if user exists in public.User table
    const { data: existingUser } = await adminSupabase
      .from('User')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (!existingUser) {
      // Create or update user with admin privileges (bypasses RLS)
      // Use upsert to handle cases where email already exists with a different auth ID
      const { error: createUserError } = await adminSupabase
        .from('User')
        .upsert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Student',
          passwordHash: 'supabase_auth_managed'
        }, { onConflict: 'email' });
      
      if (createUserError) {
        console.error('Admin client failed to create user:', createUserError);
        return NextResponse.json(
          { error: 'Failed to initialize user account: ' + createUserError.message },
          { status: 500 }
        );
      }
    }
    
    // Create the study plan
    const { data: plan, error } = await supabase
      .from('StudyPlan')
      .insert({
        userId: user.id,
        examId: examId,
        examDate: targetDate.toISOString(),
        minutesPerDay: minutesPerDay
      })
      .select(`
        id,
        examDate,
        minutesPerDay,
        createdAt,
        Exam (
          id,
          name
        )
      `)
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      plan: {
        id: plan.id,
        examName: (plan.Exam as any)?.name,
        examDate: plan.examDate,
        minutesPerDay: plan.minutesPerDay,
        createdAt: plan.createdAt
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create plan' },
      { status: 500 }
    )
  }
}
