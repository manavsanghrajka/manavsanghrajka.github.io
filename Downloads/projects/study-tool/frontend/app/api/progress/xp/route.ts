import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/progress/xp - Award XP to user
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Validate XP amount based on action
    const validActions: Record<string, number> = {
      'task_complete': 50,
      'flashcard_set': 10,
      'flashcard_review': 5,
      'perfect_quiz': 100,
      'quiz_complete': 30,
      'daily_login': 20,
      'streak_bonus': 25
    };

    const xpAmount = validActions[action];
    if (!xpAmount) {
      return NextResponse.json(
        { error: 'Invalid XP action' },
        { status: 400 }
      );
    }

    // Call RPC function to increment XP (anti-cheat: server-side calculation)
    const { data, error } = await supabase.rpc('increment_xp', {
      p_user_id: user.id,
      p_xp_amount: xpAmount
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      ...data,
      action,
      xp_awarded: xpAmount
    });
  } catch (error: any) {
    console.error('XP award error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to award XP' },
      { status: 500 }
    );
  }
}
