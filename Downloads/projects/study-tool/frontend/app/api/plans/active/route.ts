import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/plans/active - Get the active study plan with daily tasks
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get the most recent active study plan
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .select(`
        id,
        exam_date,
        minutes_per_day,
        created_at,
        exams (
          id,
          name,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (planError) {
      if (planError.code === 'PGRST116') {
        return NextResponse.json({ error: 'No active study plan found' }, { status: 404 })
      }
      throw planError
    }
    
    // Get daily tasks for this plan
    const { data: tasks, error: tasksError } = await supabase
      .from('daily_tasks')
      .select(`
        id,
        date,
        type,
        duration_minutes,
        completed,
        topics (
          id,
          name
        )
      `)
      .eq('study_plan_id', plan.id)
      .order('date', { ascending: true })
    
    if (tasksError) throw tasksError
    
    // Group tasks by date
    const daysMap = new Map<string, any[]>()
    for (const task of tasks || []) {
      const dateStr = new Date(task.date).toISOString().split('T')[0]
      if (!daysMap.has(dateStr)) {
        daysMap.set(dateStr, [])
      }
      daysMap.get(dateStr)!.push({
        id: task.id,
        type: task.type,
        durationMinutes: task.duration_minutes,
        completed: task.completed,
        topic: task.topics
      })
    }
    
    const days = Array.from(daysMap.entries()).map(([date, tasks]) => ({
      date,
      tasks
    }))
    
    return NextResponse.json({
      plan: {
        id: plan.id,
        examName: (plan.exams as any)?.name,
        examDate: plan.exam_date,
        minutesPerDay: plan.minutes_per_day,
        createdAt: plan.created_at,
        days
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active plan' },
      { status: 500 }
    )
  }
}
