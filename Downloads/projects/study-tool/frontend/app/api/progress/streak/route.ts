import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/gamification/streak - Update user's streak
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { localDate } = body;

    if (!localDate) {
      return NextResponse.json(
        { error: 'localDate is required' },
        { status: 400 }
      );
    }

    // Call RPC function to update streak
    const { data, error } = await supabase.rpc('update_streak', {
      p_user_id: user.id,
      p_local_date: localDate
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error: any) {
    console.error('Streak update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update streak' },
      { status: 500 }
    );
  }
}
