/**
 * UCAT Percentile Distribution Tables
 * 
 * Two scale systems:
 * - Current (2025+): 900–2700 (3 subtests, AR removed)
 * - Legacy (pre-2025): 1200–3600 (4 subtests)
 * 
 * Data compiled from official UCAT Consortium publications (2025 decile data)
 * and historical percentile distributions. Interpolated to finer granularity
 * for the harmonization engine.
 */

// 2025 official decile anchor points (2700 scale)
// Percentile → Score mapping
export const CURRENT_SCALE = {
  max: 2700,
  min: 900,
  // Finer-grained percentile table interpolated from official 2025 deciles
  // Format: { percentile: score }
  percentiles: {
    1:   1350,
    5:   1480,
    10:  1580,
    15:  1630,
    20:  1680,
    25:  1720,
    30:  1760,
    35:  1790,
    40:  1820,
    45:  1850,
    50:  1880,
    55:  1915,
    60:  1950,
    65:  1980,
    70:  2010,
    75:  2055,
    80:  2100,
    85:  2150,
    90:  2220,
    95:  2340,
    97:  2400,
    99:  2520,
    100: 2700,
  },
};

// Legacy scale percentile table (3600 scale, pre-2025)
// Compiled from historical UCAT data (2020–2024 averages)
export const LEGACY_SCALE = {
  max: 3600,
  min: 1200,
  percentiles: {
    1:   1800,
    5:   1970,
    10:  2100,
    15:  2190,
    20:  2260,
    25:  2320,
    30:  2370,
    35:  2420,
    40:  2460,
    45:  2500,
    50:  2530,
    55:  2570,
    60:  2610,
    65:  2650,
    70:  2690,
    75:  2740,
    80:  2800,
    85:  2860,
    90:  2940,
    95:  3080,
    97:  3160,
    99:  3310,
    100: 3600,
  },
};

// SJT Band normalization values (PRD §4.2)
export const SJT_NORMALIZATION = {
  1: 1.00,
  2: 0.75,
  3: 0.35,
  4: 0.00,
};

// SJT Band labels
export const SJT_LABELS = {
  1: 'Band 1',
  2: 'Band 2',
  3: 'Band 3',
  4: 'Band 4',
};
