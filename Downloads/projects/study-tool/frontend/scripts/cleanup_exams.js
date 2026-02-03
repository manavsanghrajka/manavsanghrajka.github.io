// Script to list and optionally delete duplicate exams
// Run with: node scripts/cleanup_exams.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listExams() {
  console.log('\n📚 All Exams in Database:\n');
  
  const { data: exams, error } = await supabase
    .from('Exam')
    .select('id, name, description, createdAt')
    .order('createdAt', { ascending: true });
  
  if (error) {
    console.error('Error fetching exams:', error.message);
    return [];
  }
  
  exams.forEach((exam, index) => {
    console.log(`${index + 1}. [${exam.id}]`);
    console.log(`   Name: ${exam.name}`);
    console.log(`   Desc: ${exam.description?.substring(0, 80)}...`);
    console.log(`   Created: ${exam.createdAt}\n`);
  });
  
  console.log(`Total: ${exams.length} exams\n`);
  return exams;
}

async function deleteExamById(examId) {
  console.log(`\n🗑️  Deleting exam: ${examId}...`);
  
  // First delete related topics (cascade should handle this, but being explicit)
  const { error: topicError } = await supabase
    .from('Topic')
    .delete()
    .eq('examId', examId);
  
  if (topicError) {
    console.error('Error deleting topics:', topicError.message);
  }
  
  // Delete the exam
  const { error: examError } = await supabase
    .from('Exam')
    .delete()
    .eq('id', examId);
  
  if (examError) {
    console.error('Error deleting exam:', examError.message);
    return false;
  }
  
  console.log('✅ Deleted successfully!');
  return true;
}

async function deleteAllExceptOne(keepId) {
  const exams = await listExams();
  
  console.log(`\n🔄 Keeping exam with ID: ${keepId}`);
  console.log('Deleting all others...\n');
  
  for (const exam of exams) {
    if (exam.id !== keepId) {
      await deleteExamById(exam.id);
    }
  }
  
  console.log('\n✅ Cleanup complete!');
  await listExams();
}

// MAIN
const args = process.argv.slice(2);

if (args[0] === 'list') {
  listExams();
} else if (args[0] === 'delete' && args[1]) {
  deleteExamById(args[1]);
} else if (args[0] === 'keep' && args[1]) {
  deleteAllExceptOne(args[1]);
} else {
  console.log(`
Usage:
  node scripts/cleanup_exams.js list              - List all exams
  node scripts/cleanup_exams.js delete <id>       - Delete a specific exam
  node scripts/cleanup_exams.js keep <id>         - Delete all EXCEPT this exam
  `);
}
