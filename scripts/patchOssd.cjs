const fs = require('fs');

let data = fs.readFileSync('src/data/medicalSchoolsData.js', 'utf8');

const updates = {
  'cambridge-a100': 'OSSD is not accepted on its own. Must be supplemented by 5 AP Exams at grade 5.',
  'oxford-a100': 'Highly competitive. OSSD typically must be supplemented by AP exams or SAT/ACT.',
  'imperial-a100': 'OSSD is considered (85-90% overall, 90%+ in Bio/Chem), but AP exams are strongly recommended to meet A*AA equivalence.',
  'ucl-a100': 'OSSD alone is not sufficient. AP scores of 5 in Biology and Chemistry are required alongside the diploma.',
  'kcl-a100': 'OSSD alone is not accepted for direct entry. Requires Foundation year or AP/IB exams.',
  'edinburgh-a100': 'OSSD alone is not sufficient. Requires AP scores of 5 in relevant subjects like Biology and Chemistry.',
  'glasgow-a100': 'OSSD is accepted natively! Minimum 85% overall with 85% in Grade 12 Biology and Chemistry.',
  'bristol-a100': 'OSSD is considered (80-90% across 6 subjects), but must contact the Americas Office to confirm science equivalence.',
  'qmul-a100': 'OSSD alone is not accepted for direct entry. Requires 3 AP exams (5,5,5) including Biology or Chemistry.',
  'newcastle-a100': 'OSSD is considered but often must be supplemented with AP courses (grades 4-5) to meet the AAA standard.'
};

for (const ObjectEntry of Object.entries(updates)) {
  const id = ObjectEntry[0];
  const note = ObjectEntry[1];
  
  // Regex to find `id: '...',` and then down to `ossdNotes: null,`
  const regex = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?ossdNotes:\\s*)null,`);
  data = data.replace(regex, `$1'${note.replace(/'/g, "\\'")}',`);
}

fs.writeFileSync('src/data/medicalSchoolsData.js', data);
console.log('Successfully patched top 10 OSSD notes!');
