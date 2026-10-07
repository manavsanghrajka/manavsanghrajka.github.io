/**
 * UCAT Score Harmonization Engine
 * 
 * Handles percentile equating between the 2700 scale (2025+) and 
 * the 3600 legacy scale (pre-2025). Implements PRD §5.
 * 
 * Uses shape-preserving piecewise linear interpolation between 
 * official percentile anchor points.
 */

import { CURRENT_SCALE, LEGACY_SCALE } from '../../data/ucatPercentileData';

/**
 * Get the percentile table as sorted arrays for interpolation.
 */
function getSortedTable(scale) {
  const entries = Object.entries(scale.percentiles)
    .map(([p, s]) => [Number(p), s])
    .sort((a, b) => a[0] - b[0]);
  return {
    percentiles: entries.map(e => e[0]),
    scores: entries.map(e => e[1]),
  };
}

const currentTable = getSortedTable(CURRENT_SCALE);
const legacyTable = getSortedTable(LEGACY_SCALE);

/**
 * Linear interpolation between two points.
 */
function lerp(x, x0, x1, y0, y1) {
  if (x1 === x0) return y0;
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
}

/**
 * Interpolate a value from a sorted table.
 * @param {number} x - Input value
 * @param {number[]} xs - Sorted x values
 * @param {number[]} ys - Corresponding y values
 * @returns {number}
 */
function interpolate(x, xs, ys) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  
  for (let i = 0; i < xs.length - 1; i++) {
    if (x >= xs[i] && x <= xs[i + 1]) {
      return lerp(x, xs[i], xs[i + 1], ys[i], ys[i + 1]);
    }
  }
  return ys[ys.length - 1];
}

/**
 * Convert a UCAT score to its percentile rank.
 * 
 * @param {number} score - Raw UCAT score
 * @param {'current'|'legacy'} scale - Which scale the score is on
 * @returns {number} Percentile (0–100)
 */
export function scoreToPercentile(score, scale = 'current') {
  const table = scale === 'legacy' ? legacyTable : currentTable;
  // Reverse lookup: score → percentile
  return Math.round(interpolate(score, table.scores, table.percentiles) * 10) / 10;
}

/**
 * Convert a percentile rank to a score on the given scale.
 * 
 * @param {number} percentile - Percentile rank (0–100)
 * @param {'current'|'legacy'} scale - Target scale
 * @returns {number} Score on the given scale
 */
export function percentileToScore(percentile, scale = 'current') {
  const table = scale === 'legacy' ? legacyTable : currentTable;
  return Math.round(interpolate(percentile, table.percentiles, table.scores));
}

/**
 * Harmonize a score from one scale to another via percentile equating.
 * PRD §5: User's score → percentile → equivalent score on other scale.
 * 
 * @param {number} score - Input score
 * @param {'current'|'legacy'} fromScale - Scale of the input score
 * @param {'current'|'legacy'} toScale - Target scale
 * @returns {number} Equivalent score on the target scale
 */
export function harmonizeScore(score, fromScale, toScale) {
  if (fromScale === toScale) return score;
  const percentile = scoreToPercentile(score, fromScale);
  return percentileToScore(percentile, toScale);
}

/**
 * Convert a legacy (3600-scale) score to current (2700-scale).
 */
export function legacyToCurrent(legacyScore) {
  return harmonizeScore(legacyScore, 'legacy', 'current');
}

/**
 * Convert a current (2700-scale) score to legacy (3600-scale).
 */
export function currentToLegacy(currentScore) {
  return harmonizeScore(currentScore, 'current', 'legacy');
}

/**
 * Get the percentile color tier based on where a user's metric
 * falls relative to a school's historical data.
 * 
 * PRD §4.1:
 * - Blue (Top 1%): Substantially exceeds offer averages
 * - Dark Green (Top 10%): Safely exceeds interview average
 * - Light Green (Top 25%): Meets/slightly exceeds interview average
 * - Yellow (Top 75%): Between cutoff and interview average
 * - Red (Top 100%): Fails to meet cutoffs
 * 
 * @param {number} userScore - User's score (on current 2700 scale)
 * @param {number} cutoff - School's minimum cutoff (2700 scale)
 * @param {number} interviewAvg - School's interview average (2700 scale)
 * @param {number} offerAvg - School's offer average (2700 scale)
 * @returns {'blue'|'darkGreen'|'lightGreen'|'yellow'|'red'}
 */
export function getPercentileColor(userScore, cutoff, interviewAvg, offerAvg) {
  if (!userScore || userScore < (cutoff || 0)) return 'red';
  
  // If no comparison data, default to yellow (we know they meet cutoff)
  if (!interviewAvg && !offerAvg) return 'yellow';
  
  const effectiveOfferAvg = offerAvg || interviewAvg;
  const effectiveIntAvg = interviewAvg || offerAvg;
  
  // Substantially exceeds offer averages (>= 105% of offer avg)
  if (userScore >= effectiveOfferAvg * 1.05) return 'blue';
  
  // Safely exceeds interview average (>= offer avg)
  if (userScore >= effectiveOfferAvg) return 'darkGreen';
  
  // Meets/slightly exceeds interview average
  if (userScore >= effectiveIntAvg) return 'lightGreen';
  
  // Between cutoff and interview average
  if (userScore >= (cutoff || 0)) return 'yellow';
  
  return 'red';
}

/**
 * Get display value for a score based on the current view mode.
 * 
 * @param {number} score - Score on current 2700 scale (or null)
 * @param {'percentile'|'current'|'legacy'} viewMode
 * @returns {string} Formatted display value
 */
export function formatScoreForView(score, viewMode = 'current') {
  if (score === null || score === undefined) return '—';
  
  switch (viewMode) {
    case 'percentile':
      return `P${scoreToPercentile(score, 'current')}`;
    case 'legacy':
      return String(currentToLegacy(score));
    case 'current':
    default:
      return String(score);
  }
}
