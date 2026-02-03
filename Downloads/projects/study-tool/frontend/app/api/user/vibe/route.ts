import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Valid vibe personas
const VALID_VIBES = ['roast', 'eli5', 'professional'] as const;
type VibePesona = typeof VALID_VIBES[number];

// GET /api/user/vibe - Get current user's vibe persona
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's vibe persona from database
    const { data, error } = await supabase
      .from('User')
      .select('vibe_persona, daily_capacity')
      .eq('id', user.id)
      .single();

    if (error) {
      // User might not exist in User table yet, return default
      return NextResponse.json({ 
        vibe_persona: 'professional',
        daily_capacity: 60
      });
    }

    return NextResponse.json({
      vibe_persona: data.vibe_persona || 'professional',
      daily_capacity: data.daily_capacity || 60
    });
  } catch (error) {
    console.error('Error fetching vibe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/user/vibe - Update user's vibe persona
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vibe_persona, daily_capacity } = body;

    // Validate vibe_persona if provided
    if (vibe_persona && !VALID_VIBES.includes(vibe_persona)) {
      return NextResponse.json({ 
        error: `Invalid vibe. Must be one of: ${VALID_VIBES.join(', ')}` 
      }, { status: 400 });
    }

    // Validate daily_capacity if provided
    if (daily_capacity !== undefined && (daily_capacity < 15 || daily_capacity > 480)) {
      return NextResponse.json({ 
        error: 'Daily capacity must be between 15 and 480 minutes' 
      }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString()
    };
    if (vibe_persona) updates.vibe_persona = vibe_persona;
    if (daily_capacity !== undefined) updates.daily_capacity = daily_capacity;

    // Update user record
    const { data, error } = await supabase
      .from('User')
      .update(updates)
      .eq('id', user.id)
      .select('vibe_persona, daily_capacity')
      .single();

    if (error) {
      // User might not exist in User table, try to insert
      const { data: insertData, error: insertError } = await supabase
        .from('User')
        .insert({
          id: user.id,
          email: user.email,
          passwordHash: 'supabase_auth', // Placeholder for Supabase Auth users
          vibe_persona: vibe_persona || 'professional',
          daily_capacity: daily_capacity || 60
        })
        .select('vibe_persona, daily_capacity')
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.json({ error: 'Failed to update vibe' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        vibe_persona: insertData.vibe_persona,
        daily_capacity: insertData.daily_capacity
      });
    }

    return NextResponse.json({
      success: true,
      vibe_persona: data.vibe_persona,
      daily_capacity: data.daily_capacity
    });
  } catch (error) {
    console.error('Error updating vibe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
