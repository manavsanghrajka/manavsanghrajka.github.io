/**
 * PercentileCellRenderer — AG Grid custom cell renderer
 * 
 * Applies 5-tier percentile color formatting to UCAT score cells.
 * Shows tooltip with raw value, percentile, and comparison context.
 */

import { getPercentileColor, formatScoreForView, scoreToPercentile } from '../../lib/medDashboard/ucatEngine';

const PercentileCellRenderer = ({ value, data, colDef, context }) => {
  if (value === null || value === undefined) {
    return <span className="no-data">—</span>;
  }

  const { userProfile, viewMode } = context || {};
  const userScore = userProfile?.ucatScore;

  // Determine color based on user's score relative to this cell's school data
  let color = 'yellow';
  if (userScore && data) {
    color = getPercentileColor(
      userScore,
      data.ucatCutoff,
      data.ucatAvgInterview,
      data.ucatOfferAvg
    );
  }

  // Format display value based on view mode
  const displayValue = formatScoreForView(value, viewMode || 'current');
  const percentile = scoreToPercentile(value, 'current');

  // Tooltip content
  const fieldName = colDef?.headerName || 'Score';
  const tooltipText = `${fieldName}: ${value}/2700 (P${percentile})`;

  return (
    <div className={`percentile-cell color-${color}`}>
      {displayValue}
      <span className="cell-tooltip">{tooltipText}</span>
    </div>
  );
};

export default PercentileCellRenderer;
