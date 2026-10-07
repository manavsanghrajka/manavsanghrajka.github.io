/**
 * Probability & Eligibility Engine
 * 
 * Calculates eligibility (hard cutoffs) and composite "Overall Chance"
 * scores per PRD §4.3.
 * 
 * C = (S_UCAT × W_UCAT) + (S_Grades × W_Grades) + (S_SJT × W_SJT)
 */

import { SJT_NORMALIZATION } from '../../data/ucatPercentileData';
import { scoreToPercentile } from './ucatEngine';
import { meetsGradeRequirement } from './gradeMapping';

/**
 * Check if a user meets all hard cutoffs for a school.
 * 
 * @param {object} userProfile - { ucatScore, sjtBand, top6Avg, chemGrade, bioGrade }
 * @param {object} school - School data object
 * @returns {boolean}
 */
export function checkEligibility(userProfile, school) {
  const { ucatScore, sjtBand, top6Avg, chemGrade, bioGrade, feeStatus, entryType } = userProfile;
  
  // International applicant check
  if (feeStatus === 'international' && (school.interviewSpotsIntl === 0 || school.annualTuitionIntl === 0)) {
    return false;
  }
  
  // Graduate entry check
  const isGraduateOnly = school.course && (school.course.includes('Graduate') || school.course.includes('A101'));
  if (entryType === 'undergraduate' && isGraduateOnly) {
    return false;
  }
  
  // UCAT minimum cutoff check
  if (school.ucatCutoff && ucatScore < school.ucatCutoff) return false;
  
  // SJT Band check — Band 4 is disqualifying at most schools
  if (school.minSjtBand && sjtBand > school.minSjtBand) return false;
  
  // If school rejects Band 4 explicitly
  if (school.sjtBand4Reject && sjtBand === 4) return false;
  
  // Grade requirements check
  const gradesMet = meetsGradeRequirement(top6Avg, chemGrade, bioGrade, {
    ossdAvg: school.gradeReqOssd,
    chemRequired: school.chemRequired,
    bioRequired: school.bioRequired,
  });
  if (!gradesMet) return false;
  
  return true;
}

/**
 * Calculate the component UCAT score (0–1) based on user's score
 * relative to the school's offer average.
 * 
 * @param {number} userScore - User's UCAT on 2700 scale
 * @param {number} offerAvg - School's offer average on 2700 scale
 * @param {number} interviewAvg - School's interview average on 2700 scale
 * @returns {number} 0–1 normalized score
 */
function calcUcatComponent(userScore, offerAvg, interviewAvg) {
  const target = offerAvg || interviewAvg;
  if (!target) return 0.5; // No data, assume median
  
  // Ratio with cap at 1.2 (to avoid runaway scores)
  const ratio = userScore / target;
  return Math.min(1.0, ratio);
}

/**
 * Calculate the component grades score (0–1) based on user's average
 * relative to the school's requirement.
 * 
 * @param {number} userAvg - User's top-6 average
 * @param {number} schoolReq - School's OSSD grade requirement
 * @returns {number} 0–1 normalized score
 */
function calcGradesComponent(userAvg, schoolReq) {
  if (!schoolReq) return 0.75; // No data, assume reasonable
  
  const ratio = userAvg / schoolReq;
  return Math.min(1.0, ratio);
}

/**
 * Calculate the Overall Chance composite score.
 * 
 * PRD §4.3:
 * C = (S_UCAT × W_UCAT) + (S_Grades × W_Grades) + (S_SJT × W_SJT)
 * 
 * @param {object} userProfile - { ucatScore, sjtBand, top6Avg, chemGrade, bioGrade }
 * @param {object} school - School data with weights
 * @returns {object} { score, badge, color }
 */
export function calculateOverallChance(userProfile, school) {
  const { ucatScore, sjtBand, top6Avg } = userProfile;
  
  // Check eligibility first
  const eligible = checkEligibility(userProfile, school);
  if (!eligible) {
    return { score: 0, badge: 'Unlikely', color: 'red' };
  }
  
  // Get weights (default to balanced if not specified)
  const wUcat = school.ucatWeight || 0.40;
  const wGrades = school.gradesWeight || 0.30;
  const wSjt = school.sjtWeight || 0.10;
  // Remaining weight is for interview (not calculated pre-interview)
  
  // Normalize weights to pre-interview total
  const preInterviewTotal = wUcat + wGrades + wSjt;
  const normUcat = wUcat / preInterviewTotal;
  const normGrades = wGrades / preInterviewTotal;
  const normSjt = wSjt / preInterviewTotal;
  
  // Component scores
  const sUcat = calcUcatComponent(ucatScore, school.ucatOfferAvg, school.ucatAvgInterview);
  const sGrades = calcGradesComponent(top6Avg, school.gradeReqOssd);
  const sSjt = SJT_NORMALIZATION[sjtBand] || 0;
  
  // Composite score
  const composite = (sUcat * normUcat) + (sGrades * normGrades) + (sSjt * normSjt);
  
  // Map to badge (PRD §4.3)
  const { badge, color } = mapScoreToBadge(composite);
  
  return { score: Math.round(composite * 100) / 100, badge, color };
}

/**
 * Map a composite score (0–1) to a badge and color.
 */
function mapScoreToBadge(score) {
  if (score >= 0.90) return { badge: 'High Chance', color: 'blue' };
  if (score >= 0.75) return { badge: 'Highly Competitive', color: 'darkGreen' };
  if (score >= 0.60) return { badge: 'Competitive', color: 'lightGreen' };
  if (score >= 0.45) return { badge: 'Borderline', color: 'yellow' };
  return { badge: 'Unlikely', color: 'red' };
}

/**
 * Get the competitive ratio for a school.
 * (applicants / spots)
 * 
 * @param {object} school
 * @param {'home'|'international'} feeStatus
 * @returns {number|null}
 */
export function getCompetitiveRatio(school, feeStatus) {
  let applicants;
  let spots;

  if (feeStatus === 'international') {
    // Isolate international applicants if available, else estimate ~20% of total
    applicants = school.applicantsIntl || (school.totalApplicants ? Math.round(school.totalApplicants * 0.20) : null);
    spots = school.interviewSpotsIntl;
  } else {
    // Isolate home applicants (Total minus international estimate)
    applicants = school.totalApplicants ? Math.round(school.totalApplicants * 0.80) : null;
    spots = school.interviewSpotsHome;
  }
  
  if (!applicants || !spots) return null;
  return Math.round((applicants / spots) * 10) / 10;
}
