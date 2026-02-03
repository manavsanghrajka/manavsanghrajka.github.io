import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateMasteryAfterReview, scoreToQuality, calculateNextInterval } from '@/lib/spaced-repetition'

// POST /api/schedule/complete - Record task completion and update mastery
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { topicId, score } = await request.json()
    
    if (!topicId || score === undefined) {
      return NextResponse.json(
        { error: 'topicId and score are required' },
        { status: 400 }
      )
    }
    
    // Get existing mastery data
    const { data: existing } = await supabase
      .from('topic_mastery')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic_id', topicId)
      .single()
    
    const quality = scoreToQuality(score)
    const now = new Date()
    
    let newMasteryData
    
    if (existing) {
      // Update existing mastery
      const currentInterval = existing.interval_days || 1
      const currentEaseFactor = existing.ease_factor || 2.5
      const { interval, easeFactor } = calculateNextInterval(currentInterval, currentEaseFactor, quality)
      
      const nextReviewDate = new Date(now)
      nextReviewDate.setDate(nextReviewDate.getDate() + interval)
      
      // Calculate new average score with exponential moving average
      const learningRate = 0.3
      const newAverageScore = existing.average_score 
        ? existing.average_score * (1 - learningRate) + (score / 100) * learningRate
        : score / 100
      
      newMasteryData = {
        average_score: newAverageScore,
        last_reviewed: now.toISOString(),
        next_review_date: nextReviewDate.toISOString(),
        ease_factor: easeFactor,
        interval_days: interval,
        review_count: quality >= 3 ? (existing.review_count || 0) + 1 : existing.review_count || 0,
        lapse_count: quality < 3 ? (existing.lapse_count || 0) + 1 : existing.lapse_count || 0
      }
      
      const { error } = await supabase
        .from('topic_mastery')
        .update(newMasteryData)
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
      
      if (error) throw error
    } else {
      // Create new mastery record
      const { interval, easeFactor } = calculateNextInterval(1, 2.5, quality)
      
      const nextReviewDate = new Date(now)
      nextReviewDate.setDate(nextReviewDate.getDate() + interval)
      
      newMasteryData = {
        user_id: user.id,
        topic_id: topicId,
        average_score: score / 100,
        last_reviewed: now.toISOString(),
        next_review_date: nextReviewDate.toISOString(),
        ease_factor: easeFactor,
        interval_days: interval,
        review_count: quality >= 3 ? 1 : 0,
        lapse_count: quality < 3 ? 1 : 0
      }
      
      const { error } = await supabase
        .from('topic_mastery')
        .insert(newMasteryData)
      
      if (error) throw error
    }
    
    return NextResponse.json({
      success: true,
      mastery: {
        score,
        quality,
        nextReviewDate: newMasteryData.next_review_date,
        interval: newMasteryData.interval_days
      }
    })
  } catch (error: any) {
    console.error('Error updating mastery:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update mastery' },
      { status: 500 }
    )
  }
}
