/**
 * BadgeCellRenderer — AG Grid custom cell renderer
 * 
 * Renders styled badges for: Source Status, Overall Chance,
 * Eligibility, Interview Style, SJT Band.
 */

const BADGE_CLASSES = {
  // Overall Chance
  'High Chance': 'badge--high-chance',
  'Highly Competitive': 'badge--highly-competitive',
  'Competitive': 'badge--competitive',
  'Borderline': 'badge--borderline',
  'Unlikely': 'badge--unlikely',
  // Source Status
  'official': 'badge--official',
  'aggregator': 'badge--aggregator',
  'estimated': 'badge--estimated',
  // Eligibility
  'Yes': 'badge--eligible-yes',
  'No': 'badge--eligible-no',
  // Interview Style
  'MMI': 'badge--mmi',
  'Panel': 'badge--panel',
  'Group': 'badge--mmi',
};

const BADGE_LABELS = {
  'official': '● Official',
  'aggregator': '◐ Aggregator',
  'estimated': '○ Estimated',
};

const BadgeCellRenderer = ({ value }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="no-data">—</span>;
  }

  const displayText = BADGE_LABELS[value] || value;
  const badgeClass = BADGE_CLASSES[value] || '';

  return (
    <span className={`badge ${badgeClass}`}>
      {displayText}
    </span>
  );
};

export default BadgeCellRenderer;
