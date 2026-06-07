import { useState, useEffect } from 'react';

const BlueBanners = () => {
  const [mode, setMode] = useState('current'); // 'current' or 'historical'
  const [currentData, setCurrentData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [currentRes, historicalRes] = await Promise.all([
          fetch('/data/blue-banners-current.json'),
          fetch('/data/blue-banners-historical.json')
        ]);

        if (!currentRes.ok || !historicalRes.ok) {
          throw new Error('Failed to load data files');
        }

        const [current, historical] = await Promise.all([
          currentRes.json(),
          historicalRes.json()
        ]);

        setCurrentData(current);
        setHistoricalData(historical);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  const data = mode === 'current' ? currentData : historicalData;

  const generatedDate = data
    ? new Date(data.generatedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      })
    : '';

  return (
    <main className="flex-grow flex flex-col items-center justify-start py-16 px-6 relative w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-terminal mb-4 text-center">
        [ BLUE BANNERS ]
      </h1>
      <p className="text-sm text-ink/70 mb-8 uppercase tracking-terminal text-center max-w-xl">
        FRC blue banner distribution across all teams
      </p>

      {/* Mode Toggle */}
      <div className="flex gap-0 mb-8 border border-structure">
        <button
          onClick={() => setMode('current')}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-terminal transition-none ${
            mode === 'current'
              ? 'bg-ink text-invert'
              : 'bg-canvas text-ink hover:bg-ink hover:text-invert'
          }`}
        >
          2026 Season
        </button>
        <button
          onClick={() => setMode('historical')}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-terminal transition-none border-l border-structure ${
            mode === 'historical'
              ? 'bg-ink text-invert'
              : 'bg-canvas text-ink hover:bg-ink hover:text-invert'
          }`}
        >
          All-Time Teams
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-sm uppercase tracking-terminal text-ink/50 animate-pulse">
          Loading data...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-highlight font-bold mb-8 uppercase tracking-terminal text-center max-w-md">
          [ ERROR: {error} ]
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="w-full max-w-4xl">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="border border-structure p-6 text-center">
              <p className="text-3xl font-bold text-ink mb-1">{data.totalTeams.toLocaleString()}</p>
              <p className="text-xs uppercase tracking-terminal text-ink/50">Total Teams</p>
            </div>
            <div className="border border-structure p-6 text-center">
              <p className="text-3xl font-bold text-ink mb-1">{data.teamsWithBanners.toLocaleString()}</p>
              <p className="text-xs uppercase tracking-terminal text-ink/50">Teams with Banners</p>
            </div>
            <div className="border border-structure p-6 text-center">
              <p className="text-3xl font-bold text-ink mb-1">{data.maxBanners}</p>
              <p className="text-xs uppercase tracking-terminal text-ink/50">Most by One Team</p>
            </div>
          </div>

          {/* Leaderboard — TBA insights style */}
          <div className="border border-structure mb-10">
            <div className="border-b border-structure p-4">
              <h2 className="text-sm font-bold uppercase tracking-terminal text-ink text-center">
                Most Blue Banners
              </h2>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[120px_1fr] border-b border-structure text-xs uppercase tracking-terminal text-ink/50 font-bold">
              <div className="p-3 text-center border-r border-structure">Number</div>
              <div className="p-3 text-center">Teams</div>
            </div>

            {/* Rows */}
            {data.leaderboard.map((row) => (
              <div
                key={row.banners}
                className="grid grid-cols-[120px_1fr] border-b border-structure last:border-b-0 text-sm"
              >
                <div className="p-3 text-center font-bold border-r border-structure text-ink">
                  {row.banners}
                </div>
                <div className="p-3 flex flex-wrap gap-x-3 gap-y-1 justify-center">
                  {row.teams.map((teamNum) => (
                    <a
                      key={teamNum}
                      href={`https://www.thebluealliance.com/team/${teamNum}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink/70 hover:text-ink hover:underline font-mono"
                    >
                      {teamNum}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Distribution — Percentage breakdown */}
          <div className="border border-structure mb-10">
            <div className="border-b border-structure p-4">
              <h2 className="text-sm font-bold uppercase tracking-terminal text-ink text-center">
                Banner Distribution
              </h2>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[80px_1fr_100px_100px] border-b border-structure text-xs uppercase tracking-terminal text-ink/50 font-bold">
              <div className="p-3 text-center border-r border-structure">Banners</div>
              <div className="p-3 border-r border-structure"></div>
              <div className="p-3 text-center border-r border-structure">Teams</div>
              <div className="p-3 text-center">Percent</div>
            </div>

            {/* Rows — show 0 banner row, then 1+ */}
            {data.distribution.map((row) => {
              // For bar scaling, use the max of the 1+ banner counts
              const maxBarCount = Math.max(
                ...data.distribution.filter(d => d.banners > 0).map(d => d.count),
                1
              );
              const barWidth = row.banners === 0 ? 0 : (row.count / maxBarCount * 100);

              return (
                <div
                  key={row.banners}
                  className={`grid grid-cols-[80px_1fr_100px_100px] border-b border-structure last:border-b-0 text-sm ${
                    row.banners === 0 ? 'text-ink/50' : 'text-ink'
                  }`}
                >
                  <div className="p-3 text-center font-bold border-r border-structure">
                    {row.banners}
                  </div>
                  <div className="p-3 border-r border-structure flex items-center">
                    {row.banners > 0 && (
                      <div className="w-full h-4 bg-canvas overflow-hidden">
                        <div
                          className="h-full bg-ink/60"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    )}
                    {row.banners === 0 && (
                      <span className="text-xs uppercase tracking-terminal">No banners</span>
                    )}
                  </div>
                  <div className="p-3 text-center font-mono border-r border-structure">
                    {row.count.toLocaleString()}
                  </div>
                  <div className="p-3 text-center font-mono">
                    {row.percent.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Attribution */}
          <div className="text-center mb-4">
            <p className="text-xs text-ink/30 uppercase tracking-terminal">
              Data generated {generatedDate} · Powered by{' '}
              <a
                href="https://www.thebluealliance.com"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-ink/60"
              >
                The Blue Alliance
              </a>
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

export default BlueBanners;
