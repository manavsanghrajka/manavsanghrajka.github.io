import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/admin/exams - List all exams
export async function GET() {
  try {
    const adminSupabase = createAdminClient()
    
    const { data: exams, error } = await adminSupabase
      .from('Exam')
      .select('id, name, description, createdAt')
      .order('createdAt', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json({ exams: exams || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/exams - Delete an exam by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('id')
    
    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required as query param ?id=...' },
        { status: 400 }
      )
    }
    
    const adminSupabase = createAdminClient()
    
    // Delete related topics first (should cascade, but being explicit)
    await adminSupabase
      .from('Topic')
      .delete()
      .eq('examId', examId)
    
    // Delete related study plans
    await adminSupabase
      .from('StudyPlan')
      .delete()
      .eq('examId', examId)
    
    // Delete the exam
    const { error } = await adminSupabase
      .from('Exam')
      .delete()
      .eq('id', examId)
    
    if (error) throw error
    
    return NextResponse.json({ success: true, deletedId: examId })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete exam' },
      { status: 500 }
    )
  }
}
