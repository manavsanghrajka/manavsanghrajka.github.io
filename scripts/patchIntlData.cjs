const fs = require('fs');

let data = fs.readFileSync('src/data/medicalSchoolsData.js', 'utf8');

const specificData = {
  'birmingham-a100': { applicantsIntl: 493, interviewsExtendedIntl: 104, offersGivenIntl: 60, interviewSpotsIntl: 28 },
  'manchester-a100': { applicantsIntl: 704, interviewsExtendedIntl: 322, offersGivenIntl: 162, interviewSpotsIntl: 35 },
  'kcl-a100': { applicantsIntl: 829, interviewsExtendedIntl: 186, offersGivenIntl: 153, interviewSpotsIntl: 25 },
  'ucl-a100': { applicantsIntl: 671, interviewsExtendedIntl: 144, offersGivenIntl: 61, interviewSpotsIntl: 24 },
  'edinburgh-a100': { applicantsIntl: 483, interviewsExtendedIntl: 98, offersGivenIntl: 45, interviewSpotsIntl: 20 },
  'oxford-a100': { applicantsIntl: 260, interviewsExtendedIntl: 33, offersGivenIntl: 8, interviewSpotsIntl: 14 },
  'cambridge-a100': { applicantsIntl: 450, interviewsExtendedIntl: 60, offersGivenIntl: 25, interviewSpotsIntl: 21 },
  'glasgow-a100': { applicantsIntl: 533, interviewsExtendedIntl: 164, offersGivenIntl: 50, interviewSpotsIntl: 25 },
};

// We will use a function to process each object
// 1. replace interviewSpotsIntl: X,
// 2. replace applicantsIntl: X,
// 3. replace offersGivenIntl: X,
// 4. insert interviewsExtendedIntl: X, right after interviewsExtended: X,

const schoolRegex = /(id:\s*'([^']+)'[\s\S]*?)(interviewSpotsIntl:\s*[^,]+,)([\s\S]*?)(interviewsExtended:\s*[^,]+,)([\s\S]*?)(applicantsIntl:\s*[^,]+,)([\s\S]*?)(offersGivenIntl:\s*[^,]+,)/g;

data = data.replace(schoolRegex, (match, prefix, id, spotsMatch, mid1, intsMatch, mid2, appsMatch, mid3, offersMatch) => {
  const custom = specificData[id];
  
  const newSpots = custom ? `interviewSpotsIntl: ${custom.interviewSpotsIntl},` : `interviewSpotsIntl: null,`;
  const newApps = custom ? `applicantsIntl: ${custom.applicantsIntl},` : `applicantsIntl: null,`;
  const newOffers = custom ? `offersGivenIntl: ${custom.offersGivenIntl},` : `offersGivenIntl: null,`;
  const newIntsExtended = custom ? `interviewsExtendedIntl: ${custom.interviewsExtendedIntl},` : `interviewsExtendedIntl: null,`;
  
  return prefix + newSpots + mid1 + intsMatch + '\n    ' + newIntsExtended + mid2 + newApps + mid3 + newOffers;
});

fs.writeFileSync('src/data/medicalSchoolsData.js', data);
console.log('Successfully patched International FOI Data and injected interviewsExtendedIntl!');
