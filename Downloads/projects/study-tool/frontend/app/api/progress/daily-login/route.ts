import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/gamification/daily-login - Claim daily login bonus
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

    // Call RPC function to claim daily login
    const { data, error } = await supabase.rpc('claim_daily_login', {
      p_user_id: user.id,
      p_local_date: localDate
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error: any) {
    console.error('Daily login error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to claim daily login' },
      { status: 500 }
    );
  }
}
