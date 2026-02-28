import { useState } from 'react';
import { predictStock, getHistoricalAccuracy } from '../../lib/stockApi';

const MARKETS = [
  { value: 'NASDAQ', label: 'NASDAQ' },
  { value: 'NYSE', label: 'NYSE' },
  { value: 'TSX', label: 'TSX (Toronto)' },
];

const StockPredictor = () => {
  const [ticker, setTicker] = useState('');
  const [market, setMarket] = useState('NASDAQ');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [accuracyStats, setAccuracyStats] = useState(null);

  const handlePredict = async () => {
    if (!ticker.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const prediction = await predictStock(ticker, market);
      setResult(prediction);
      
      // Fetch accuracy stats
      const stats = await getHistoricalAccuracy(ticker);
      setAccuracyStats(stats);
      
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-start py-16 px-6">
      <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-terminal text-center text-ink mb-4">
        [ STOCK PRICE PREDICTOR ]
      </h1>
      <p className="text-sm text-ink/70 text-center mb-8 max-w-xl">
        Global Lasso Regression model using technical indicators and S&P 500 macroeconomic dynamics.
      </p>

      <div className="w-full max-w-2xl">
        {/* Input Form */}
        <div className="border border-structure p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Ticker Input */}
            <div>
              <label className="block text-xs uppercase tracking-terminal text-ink/70 mb-2">
                TICKER SYMBOL
              </label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g. AAPL"
                className="w-full bg-canvas border border-structure p-3 text-sm font-mono uppercase"
              />
            </div>

            {/* Market Dropdown */}
            <div>
              <label className="block text-xs uppercase tracking-terminal text-ink/70 mb-2">
                MARKET
              </label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full bg-canvas border border-structure p-3 text-sm font-mono"
              >
                {MARKETS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Predict Button */}
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full bg-highlight text-invert p-4 text-sm uppercase tracking-terminal font-semibold hover:bg-ink transition-none disabled:opacity-50"
          >
            {loading ? '[ ANALYZING... ]' : '[ PREDICT NEXT DAY CLOSE ]'}
          </button>

          {/* Error Message */}
          {error && (
            <p className="mt-4 text-sm text-red-600 uppercase tracking-terminal text-center">
              [ {error} ]
            </p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="border border-structure p-6 mb-6 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-terminal">
                  {result.ticker}
                </h2>
              </div>
              <span className="text-xs uppercase tracking-terminal text-ink/50 block text-right mt-1">
                {result.currency}
              </span>
            </div>

            {/* Price Prediction */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-structure p-4">
                <p className="text-xs uppercase tracking-terminal text-ink/70 mb-1">
                  CURRENT CLOSING PRICE
                </p>
                <p className="text-2xl font-bold">
                  ${(result.current_price || 0).toFixed(2)}
                </p>
              </div>
              <div className="border border-structure p-4 bg-highlight/10">
                <p className="text-xs uppercase tracking-terminal text-ink/70 mb-1">
                  PREDICTED (NEXT DAY)
                </p>
                <p className="text-2xl font-bold">
                  ${(result.predicted_price || 0).toFixed(2)}
                </p>
                <p className={`text-xs font-bold ${result.direction === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                  {result.direction === 'UP' ? '▲' : '▼'} {' '}
                  {Math.abs(result.predicted_log_return * 100).toFixed(2)}% ({result.direction})
                </p>
              </div>
            </div>

            {/* Historical Accuracy */}
            {accuracyStats && (
              <div className="border border-structure p-4 mb-6 bg-canvas">
                <p className="text-xs uppercase tracking-terminal text-ink/70 mb-2">
                  HISTORICAL ACCURACY ({accuracyStats.isGlobal ? 'GLOBAL TOP 50' : accuracyStats.ticker})
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className={`text-2xl font-bold ${accuracyStats.accuracy > 50 ? 'text-green-600' : 'text-orange-500'}`}>
                      {accuracyStats.accuracy.toFixed(1)}%
                    </span>
                    <span className="text-xs text-ink/50 ml-2 uppercase tracking-terminal">
                      WIN RATE
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-ink/70">
                      {accuracyStats.correct} / {accuracyStats.total} CORRECT PREDICTIONS
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature Importance (Global Lasso Weights) */}
            {result.feature_importance && Object.keys(result.feature_importance).length > 0 && (
              <div className="border border-structure p-4 mb-6">
                <p className="text-xs uppercase tracking-terminal text-ink/70 mb-4">
                  ACTIVE GLOBAL VARIABLES (LASSO SHRINKAGE)
                </p>
                <div className="space-y-4">
                  {Object.entries(result.feature_importance)
                    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)) // Sort by absolute weight magnitude
                    .map(([feature, weight]) => {
                      // Normalize the bar width relative to the max absolute weight
                      const maxAbsWeight = Math.max(...Object.values(result.feature_importance).map(Math.abs));
                      const relativeWidth = maxAbsWeight > 0 ? (Math.abs(weight) / maxAbsWeight) * 100 : 0;
                      const isPositive = weight > 0;

                      return (
                        <div key={feature}>
                          <div className="flex justify-between text-xs tracking-terminal mb-1">
                            <span className="uppercase">{feature}</span>
                            <span className={`font-mono ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {weight > 0 ? '+' : ''}{weight.toFixed(5)}
                            </span>
                          </div>
                          {/* Split center bar visualizer */}
                          <div className="w-full h-1.5 bg-structure relative flex items-center">
                             {/* Center Line */}
                             <div className="absolute left-1/2 w-px h-3 bg-ink/30 z-10" />
                             
                             {/* Bar Fill */}
                             {isPositive ? (
                               <div 
                                 className="h-full bg-green-500"
                                 style={{ width: `${relativeWidth / 2}%`, marginLeft: '50%' }}
                               />
                             ) : (
                               <div 
                                 className="h-full bg-red-500 absolute"
                                 style={{ width: `${relativeWidth / 2}%`, right: '50%' }}
                               />
                             )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-ink/50 text-center mt-6 uppercase tracking-terminal">
          [ DISCLAIMER: THIS IS FOR EDUCATIONAL PURPOSES ONLY. NOT FINANCIAL ADVICE. ]
        </p>
      </div>
    </main>
  );
};

export default StockPredictor;
