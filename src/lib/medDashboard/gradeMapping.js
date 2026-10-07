/**
 * A-Level ↔ OSSD Grade Mapping Engine
 * 
 * Converts UK A-Level grade requirements to Ontario Secondary School
 * Diploma (OSSD) percentage equivalents for the Top 6 average.
 * 
 * PRD §6.2 defines the core mapping table.
 */

// A-Level grade to numeric points (for parsing grade strings)
const ALEVEL_POINTS = {
  'A*': 6,
  'A':  5,
  'B':  4,
  'C':  3,
  'D':  2,
  'E':  1,
};

// A-Level requirement strings → OSSD % equivalent (PRD §6.2)
const ALEVEL_TO_OSSD_MAP = {
  "A*A*A*": 96,
  "A*A*A":  93,
  "A*AA":   90,
  "AAA":    88,
  "AAB":    85,
  "ABB":    82,
  "BBB":    80,
  "BBC":    78,
};

/**
 * Parse an A-Level requirement string (e.g., "A*AA" or "AAB") 
 * and return the equivalent OSSD top-6 average percentage.
 * 
 * @param {string} aLevelString - e.g., "A*AA", "AAB"
 * @returns {number|null} OSSD percentage or null if unparseable
 */
export function convertALevelToOssd(aLevelString) {
  if (!aLevelString) return null;
  
  // Normalize: trim, uppercase
  const normalized = aLevelString.trim().toUpperCase().replace(/\s+/g, '');
  
  // Direct lookup first
  if (ALEVEL_TO_OSSD_MAP[normalized] !== undefined) {
    return ALEVEL_TO_OSSD_MAP[normalized];
  }
  
  // Try to parse individual grades and compute an average-based OSSD
  const grades = parseALevelGrades(normalized);
  if (grades.length === 0) return null;
  
  const totalPoints = grades.reduce((sum, g) => sum + (ALEVEL_POINTS[g] || 0), 0);
  const avgPoints = totalPoints / grades.length;
  
  // Linear interpolation: A*A*A* (avgPoints=6) → 96%, BBB (avgPoints=4) → 80%
  // Slope: (96 - 80) / (6 - 4) = 8 per point
  const ossd = Math.round(80 + (avgPoints - 4) * 8);
  return Math.min(100, Math.max(70, ossd));
}

/**
 * Parse "A*AA" into ['A*', 'A', 'A']
 */
function parseALevelGrades(str) {
  const grades = [];
  let i = 0;
  while (i < str.length) {
    if (i + 1 < str.length && str[i] === 'A' && str[i + 1] === '*') {
      grades.push('A*');
      i += 2;
    } else if ('ABCDE'.includes(str[i])) {
      grades.push(str[i]);
      i += 1;
    } else {
      i += 1; // skip unexpected chars
    }
  }
  return grades;
}

/**
 * Check if a user's OSSD grades meet a school's requirements.
 * 
 * @param {number} userTop6Avg - User's top 6 average (0-100)
 * @param {number} userChem - User's Chemistry grade (0-100) 
 * @param {number} userBio - User's Biology grade (0-100)
 * @param {object} schoolReq - { ossdAvg, chemRequired, bioRequired }
 * @returns {boolean}
 */
export function meetsGradeRequirement(userTop6Avg, userChem, userBio, schoolReq) {
  if (!schoolReq) return true;
  
  const { ossdAvg, chemRequired, bioRequired } = schoolReq;
  
  // Check top 6 average
  if (ossdAvg && userTop6Avg < ossdAvg) return false;
  
  // Check specific subject requirements (most UK med schools need Chemistry)
  if (chemRequired && userChem < 75) return false;
  if (bioRequired && userBio < 75) return false;
  
  return true;
}

/**
 * Format grade requirement for display
 * Shows OSSD percentage with A-Level in parentheses
 * 
 * @param {string} aLevel - Original A-Level requirement
 * @param {number|null} ossd - OSSD equivalent (or null to compute)
 * @returns {string}
 */
export function formatGradeReq(aLevel, ossd = null) {
  const ossdPct = ossd || convertALevelToOssd(aLevel);
  if (!ossdPct) return aLevel || '—';
  return `${ossdPct}%`;
}

/**
 * Get tooltip text showing the A-Level equivalent
 */
export function getGradeTooltip(aLevel, ossd = null, ossdNotes = null) {
  const ossdPct = ossd || convertALevelToOssd(aLevel);
  if (!aLevel && !ossdPct) return '';
  let tooltip = `A-Level: ${aLevel || 'N/A'} → OSSD: ${ossdPct || 'N/A'}%`;
  
  if (ossdNotes) {
    tooltip += `\n\n⚠️ OSSD Note:\n${ossdNotes}`;
  }
  
  return tooltip;
}
