import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/gamification - Get user's gamification stats
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get gamification stats
    const { data, error } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default stats if user has no gamification record
    if (!data) {
      return NextResponse.json({
        xp: 0,
        level: 1,
        currentStreak: 0,
        xpForNextLevel: 1000,
        xpProgress: 0
      });
    }

    // Calculate XP for next level: 1000 * 1.6^(level-1)
    const xpForNextLevel = Math.floor(1000 * Math.pow(1.6, data.level - 1));
    
    // Calculate XP progress towards current level
    const prevLevelXp = data.level === 1 ? 0 : Math.floor(1000 * Math.pow(1.6, data.level - 2));
    const xpInCurrentLevel = data.xp - prevLevelXp;
    const xpNeededForLevel = xpForNextLevel - prevLevelXp;
    const xpProgress = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));

    return NextResponse.json({
      xp: data.xp,
      level: data.level,
      currentStreak: data.current_streak,
      xpForNextLevel,
      xpProgress,
      lastStudyDate: data.last_study_date
    });
  } catch (error: any) {
    console.error('Gamification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch gamification stats' },
      { status: 500 }
    );
  }
}
