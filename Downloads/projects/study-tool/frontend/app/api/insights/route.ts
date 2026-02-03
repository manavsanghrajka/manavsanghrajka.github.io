import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/analytics - Get user analytics
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get quiz results
    const { data: quizResults, error: quizError } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (quizError) throw quizError
    
    const results = quizResults || []
    
    // Calculate study streak
    let studyStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const activityDates = results
      .map(r => {
        const d = new Date(r.created_at)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      })
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => b - a)
    
    for (let i = 0; i < activityDates.length; i++) {
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      if (activityDates[i] === expectedDate.getTime()) {
        studyStreak++
      } else {
        break
      }
    }
    
    // Calculate stats
    const totalStudyTime = Math.round(results.length * 0.5) // ~30 min per quiz
    
    const topicsCompleted = results
      .filter(r => r.score >= 70)
      .map(r => r.topic_id)
      .filter((v, i, a) => v && a.indexOf(v) === i)
      .length
    
    const averageScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length / 100
      : 0
    
    const recentScores = results
      .slice(0, 10)
      .reverse()
      .map(r => ({
        date: new Date(r.created_at).toLocaleDateString(),
        score: Math.round(r.score)
      }))
    
    // Get topic mastery
    const { data: masteryData, error: masteryError } = await supabase
      .from('topic_mastery')
      .select(`
        average_score,
        topics (
          name
        )
      `)
      .eq('user_id', user.id)
    
    if (masteryError) throw masteryError
    
    const topicMastery = (masteryData || []).map((m: any) => ({
      topic: m.topics?.name || 'Unknown',
      mastery: Math.round((m.average_score || 0) * 100)
    }))
    
    return NextResponse.json({
      studyStreak,
      totalStudyTime,
      topicsCompleted,
      averageScore,
      recentScores,
      topicMastery
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
