import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get counts from each table
    const [coursesResult, topicsResult, flashcardsResult] = await Promise.all([
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('topics').select('*', { count: 'exact', head: true }),
      supabase.from('flashcards').select('*', { count: 'exact', head: true })
    ]);

    return NextResponse.json({
      courses: coursesResult.count || 0,
      topics: topicsResult.count || 0,
      flashcards: flashcardsResult.count || 0,
      status: 'active'
    });

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
