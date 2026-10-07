const fs = require('fs');

let data = fs.readFileSync('src/data/medicalSchoolsData.js', 'utf8');

const specificUpdates = {
  'manchester-a100': 'OSSD alone is typically not sufficient. Explicitly requires three AP exams at 4,4,4 including Biology or Chemistry.',
  'birmingham-a100': 'Considered. Generally expects 85-90%+ overall in top Grade 12 subjects, including Biology and Chemistry.',
  'leeds-a100': 'OSSD alone is typically not sufficient. Students usually need to supplement with APs, IB, or a degree.',
  'southampton-a100': 'Considered (strong average across 6 Grade 12 subjects), but APs are often required to demonstrate rigor.',
};

const genericNote = 'OSSD is generally considered (typically requiring 85-90%+ overall across 6 Grade 12 U/M courses with high grades in Bio/Chem). However, many schools may request AP exams to supplement the diploma. Verify directly with admissions.';

// Replace specific updates
for (const [id, note] of Object.entries(specificUpdates)) {
  const regex = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?ossdNotes:\\s*)null,`);
  data = data.replace(regex, `$1'${note.replace(/'/g, "\\'")}',`);
}

// Replace all remaining nulls with the generic note
data = data.replace(/ossdNotes:\s*null,/g, `ossdNotes: '${genericNote.replace(/'/g, "\\'")}',`);

fs.writeFileSync('src/data/medicalSchoolsData.js', data);
console.log('Successfully patched remaining OSSD notes!');
