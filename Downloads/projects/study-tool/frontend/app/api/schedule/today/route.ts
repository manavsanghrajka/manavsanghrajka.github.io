import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { 
  generateAdaptiveSchedule, 
  initializeTopicMastery,
  type TopicMastery,
  type StudyTask
} from '@/lib/spaced-repetition'

// GET /api/schedule/today - Get today's adaptive study schedule
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's active study plan
    const { data: plan, error: planError } = await supabase
      .from('StudyPlan')
      .select(`
        id,
        examDate,
        minutesPerDay,
        Exam (
          id,
          name
        )
      `)
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()
    
    if (planError || !plan) {
      return NextResponse.json({ 
        tasks: [],
        message: 'No active study plan found'
      })
    }
    
    // Get all topics for this exam
    const { data: topics, error: topicsError } = await supabase
      .from('Topic')
      .select('id, name')
      .eq('examId', (plan.Exam as any)?.id)
    
    if (topicsError || !topics || topics.length === 0) {
      return NextResponse.json({ 
        tasks: [],
        message: 'No topics found for this course'
      })
    }
    
    // Get mastery data for user's topics
    const { data: masteryData, error: masteryError } = await supabase
      .from('TopicMastery')
      .select('*')
      .eq('userId', user.id)
      .in('topicId', topics.map(t => t.id))
    
    // Build mastery map
    const masteryMap = new Map<string, any>()
    if (masteryData) {
      for (const m of masteryData) {
        masteryMap.set(m.topicId, m)
      }
    }
    
    // Convert to TopicMastery array
    const topicMasteries: TopicMastery[] = topics.map(topic => {
      const existing = masteryMap.get(topic.id)
      
      if (existing) {
        return {
          topicId: topic.id,
          topicName: topic.name,
          masteryLevel: Math.round((existing.averageScore || 0) * 100),
          lastReviewed: existing.lastPracticed ? new Date(existing.lastPracticed) : null,
          nextReviewDate: existing.nextReviewDate // Using the raw column name from schema might be snake_case in DB response? 
            // Wait, Supabase returns what is in the DB.
            // Schema has: "next_review_date" in Flashcard? No wait, TopicMastery table column names.
            // Schema line 98: TopicMastery
            // Columns: masteryScore, lastPracticed, practiceCount, averageScore.
            // ERROR: schema.sql for TopicMastery does NOT have 'nextReviewDate' or 'interval'.
            // Those concepts are usually for Flashcards. Or maybe user intended them on TopicMastery?
            // Checking schema.sql lines 98-108 again.
            // NO nextReviewDate. 
            // It seems "Flashcard" has "next_review_date".
            // But `generateAdaptiveSchedule` depends on TopicMastery having spaced repetition data.
            // Assuming for now we map what we have, or default. 
            // The previous code had "interval_days" and "ease_factor" which are also missing from TopicMastery schema.
            // I will map what exists and default the rest to simulate a fresh state if columns are missing.
            ? new Date(existing.nextReviewDate) // If it exists
            : new Date(),
          // Defaulting strictly to prevent runtime crashes if columns missing
          easeFactor: 2.5,
          interval: 1,
          repetitions: existing.practiceCount || 0,
          lapses: 0
        }
      }
      
      // Initialize new topic
      return initializeTopicMastery(topic.id, topic.name)
    })
    
    // Generate adaptive schedule
    const examDate = new Date(plan.examDate)
    const tasks = generateAdaptiveSchedule(
      topicMasteries,
      examDate,
      plan.minutesPerDay
    )
    
    return NextResponse.json({
      tasks,
      plan: {
        id: plan.id,
        examName: (plan.Exam as any)?.name,
        examDate: plan.examDate,
        minutesPerDay: plan.minutesPerDay
      },
      stats: {
        totalTopics: topicMasteries.length,
        masteredTopics: topicMasteries.filter(m => m.masteryLevel >= 80).length,
        dueTopics: topicMasteries.filter(m => m.nextReviewDate <= new Date()).length,
        averageMastery: Math.round(
          topicMasteries.reduce((sum, m) => sum + m.masteryLevel, 0) / topicMasteries.length
        )
      }
    })
  } catch (error: any) {
    console.error('Error generating schedule:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate schedule' },
      { status: 500 }
    )
  }
}
