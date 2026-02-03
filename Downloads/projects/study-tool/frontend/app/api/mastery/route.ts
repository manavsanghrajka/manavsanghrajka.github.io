import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { initializeTopicMastery, type TopicMastery } from '@/lib/spaced-repetition'

// GET /api/mastery - Get all mastery data for current user
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's mastery data with topic names
    const { data: masteryData, error } = await supabase
      .from('topic_mastery')
      .select(`
        *,
        topics (
          id,
          name,
          units (
            name,
            exams (
              id,
              name
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .order('next_review_date', { ascending: true })
    
    if (error) throw error
    
    // Transform to TopicMastery format
    const mastery: (TopicMastery & { courseName?: string; unitName?: string })[] = (masteryData || []).map((m: any) => ({
      topicId: m.topic_id,
      topicName: m.topics?.name || 'Unknown',
      unitName: m.topics?.units?.name,
      courseName: m.topics?.units?.exams?.name,
      masteryLevel: Math.round((m.average_score || 0) * 100),
      lastReviewed: m.last_reviewed ? new Date(m.last_reviewed) : null,
      nextReviewDate: m.next_review_date ? new Date(m.next_review_date) : new Date(),
      easeFactor: m.ease_factor || 2.5,
      interval: m.interval_days || 1,
      repetitions: m.review_count || 0,
      lapses: m.lapse_count || 0
    }))
    
    // Calculate summary stats
    const now = new Date()
    const stats = {
      totalTopics: mastery.length,
      masteredTopics: mastery.filter(m => m.masteryLevel >= 80).length,
      learningTopics: mastery.filter(m => m.masteryLevel > 0 && m.masteryLevel < 80).length,
      newTopics: mastery.filter(m => m.masteryLevel === 0).length,
      dueToday: mastery.filter(m => m.nextReviewDate <= now).length,
      averageMastery: mastery.length > 0 
        ? Math.round(mastery.reduce((sum, m) => sum + m.masteryLevel, 0) / mastery.length)
        : 0
    }
    
    return NextResponse.json({ mastery, stats })
  } catch (error: any) {
    console.error('Error fetching mastery:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mastery data' },
      { status: 500 }
    )
  }
}
