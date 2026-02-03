import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateCourseFromDocument } from '@/lib/gemini'

// POST /api/admin/import-course - Import a course from JSON or Document
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    let jsonData;

    // Determine content type
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Convert file to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      
      // Generate course structure from document using Gemini
      try {
        jsonData = await generateCourseFromDocument(base64, file.type);
      } catch (aiError: any) {
        console.error('AI Processing Error:', aiError);
        return NextResponse.json({ error: 'Failed to process document with AI: ' + aiError.message }, { status: 500 });
      }

    } else {
      // Handle raw JSON input
      jsonData = await request.json();
    }
    
    if (!jsonData || !jsonData.title) {
      return NextResponse.json(
        { error: 'Invalid course data: Title is required' },
        { status: 400 }
      )
    }
    
    // Check if this is a private import (from student import page)
    // For multipart/form-data, check for isPrivate field
    // For JSON, check jsonData.isPrivate
    let isPrivate = false;
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.clone().formData();
      isPrivate = formData.get('isPrivate') === 'true';
    } else if (jsonData.isPrivate !== undefined) {
      isPrivate = jsonData.isPrivate;
    }
    
    // Determine userId: set for private courses, null for global
    const courseUserId = isPrivate ? user.id : null;
    
    // Check if exam/course already exists (for this user if private, or globally if admin)
    let examQuery = supabase
      .from('Exam')
      .select('id, name, userId')
      .eq('name', jsonData.title);
    
    // If private, check for user's existing course OR global course with same name
    // If global (admin), only check for existing global course
    if (isPrivate) {
      // For private: match user's course or any global course
      examQuery = examQuery.or(`userId.eq.${user.id},userId.is.null`);
    } else {
      // For global: only match global courses
      examQuery = examQuery.is('userId', null);
    }
    
    let { data: exam } = await examQuery.single();

    let isNewExam = false;

    if (!exam) {
      // Create the exam/course if it doesn't exist
      const { data: newExam, error: examError } = await supabase
        .from('Exam')
        .insert({
          name: jsonData.title,
          description: jsonData.description || null,
          userId: courseUserId
        })
        .select()
        .single()
      
      if (examError) throw examError
      exam = newExam
      isNewExam = true
    }
    
    if (!exam) {
      throw new Error('Failed to create or retrieve exam');
    }
    
    // Create topics with full study content (flattened from units)
    let topicsCreated = 0
    
    if (isNewExam && jsonData.units && Array.isArray(jsonData.units)) {
      for (const unit of jsonData.units) {
        // We don't have a 'Unit' table, so we use 'unitName' on the Topic table
        if (unit.topics && Array.isArray(unit.topics)) {
          for (const topic of unit.topics) {
            // Handle both old format (string) and new format (object with content)
            const topicData = typeof topic === 'string' 
              ? { name: topic, summary: null, keyPoints: [], examples: [] }
              : topic;
            
            const { error: topicError } = await supabase
              .from('Topic')
              .insert({
                examId: exam.id,
                name: topicData.name,
                unitName: unit.name,
                description: topicData.description || null,
                summary: topicData.summary || null,
                keyPoints: topicData.keyPoints || [],
                examples: topicData.examples || [],
                weight: unit.weight
              })
            
            if (!topicError) {
              topicsCreated++
            } else {
                console.error('Error creating topic:', topicError);
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      course: {
        id: exam.id,
        name: exam.name
      },
      topicsCreated
    })
  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import course' },
      { status: 500 }
    )
  }
}
