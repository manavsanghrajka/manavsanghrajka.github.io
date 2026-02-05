import { useState } from 'react';

const MatchList = ({ matches, teamStats, teamNumber }) => {
  const [filter, setFilter] = useState('all'); // 'all' or 'team'
  const [expandedMatch, setExpandedMatch] = useState(null);

  // Filter matches
  const filteredMatches = filter === 'team'
    ? matches.filter((match) => {
        const redTeams = match.alliances?.red?.team_keys || [];
        const blueTeams = match.alliances?.blue?.team_keys || [];
        const teamKey = `frc${teamNumber}`;
        return redTeams.includes(teamKey) || blueTeams.includes(teamKey);
      })
    : matches;

  const getMatchLabel = (match) => {
    const levelNames = { qm: 'Quals', ef: 'Eighths', qf: 'Quarters', sf: 'Semis', f: 'Finals' };
    const level = levelNames[match.comp_level] || match.comp_level.toUpperCase();
    if (match.comp_level === 'qm') {
      return `${level} ${match.match_number}`;
    }
    return `${level} ${match.set_number}-${match.match_number}`;
  };

  const getTeamNumber = (teamKey) => parseInt(teamKey.replace('frc', ''));

  const getAllianceEPA = (teams) => {
    return teams.reduce((total, teamKey) => {
      const num = getTeamNumber(teamKey);
      return total + (teamStats[num]?.epa?.total || 0);
    }, 0);
  };

  const isTeamInAlliance = (teams) => {
    return teams.includes(`frc${teamNumber}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Filter Toggle */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm uppercase tracking-terminal border transition-none ${
            filter === 'all'
              ? 'bg-highlight text-invert border-highlight'
              : 'border-structure hover:bg-highlight hover:text-invert'
          }`}
        >
          {filter === 'all' ? '[*]' : '[ ]'} ALL MATCHES
        </button>
        <button
          onClick={() => setFilter('team')}
          className={`px-4 py-2 text-sm uppercase tracking-terminal border transition-none ${
            filter === 'team'
              ? 'bg-highlight text-invert border-highlight'
              : 'border-structure hover:bg-highlight hover:text-invert'
          }`}
        >
          {filter === 'team' ? '[*]' : '[ ]'} FRC {teamNumber} ONLY
        </button>
      </div>

      {filteredMatches.length === 0 && (
        <p className="text-center text-sm text-ink/70 uppercase tracking-terminal">
          [ NO MATCHES FOUND ]
        </p>
      )}

      {/* Match List */}
      <div className="space-y-3">
        {filteredMatches.map((match) => {
          const redTeams = match.alliances?.red?.team_keys || [];
          const blueTeams = match.alliances?.blue?.team_keys || [];
          const redEPA = getAllianceEPA(redTeams);
          const blueEPA = getAllianceEPA(blueTeams);
          const isExpanded = expandedMatch === match.key;
          const teamInRed = isTeamInAlliance(redTeams);
          const teamInBlue = isTeamInAlliance(blueTeams);
          const teamInMatch = teamInRed || teamInBlue;
          
          // Calculate win probability (very simplified)
          const totalEPA = redEPA + blueEPA;
          const redWinProb = totalEPA > 0 ? (redEPA / totalEPA * 100) : 50;
          const blueWinProb = 100 - redWinProb;
          const teamWinProb = teamInRed ? redWinProb : teamInBlue ? blueWinProb : null;

          return (
            <div key={match.key} className="border border-structure">
              {/* Match Header */}
              <button
                onClick={() => setExpandedMatch(isExpanded ? null : match.key)}
                className="w-full p-4 text-left hover:bg-highlight hover:text-invert transition-none group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold uppercase tracking-terminal">
                    {getMatchLabel(match)}
                  </span>
                  {teamInMatch && teamWinProb && (
                    <span className="text-xs uppercase tracking-terminal">
                      4308 WIN: {teamWinProb.toFixed(0)}%
                    </span>
                  )}
                  <span className="text-xs uppercase tracking-terminal">
                    {isExpanded ? '[ - ]' : '[ + ]'}
                  </span>
                </div>
                
                {/* Mini Preview */}
                <div className="flex gap-4 mt-2 text-xs">
                  <span className={`${teamInRed ? 'font-bold' : 'text-ink/70 group-hover:text-invert/70'}`}>
                    RED: {redTeams.map(t => getTeamNumber(t)).join(', ')}
                  </span>
                  <span className={`${teamInBlue ? 'font-bold' : 'text-ink/70 group-hover:text-invert/70'}`}>
                    BLUE: {blueTeams.map(t => getTeamNumber(t)).join(', ')}
                  </span>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-structure p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Red Alliance */}
                    <div className={`border p-4 ${teamInRed ? 'border-highlight bg-highlight/10' : 'border-structure'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold uppercase tracking-terminal text-red-600">
                          RED ALLIANCE
                        </span>
                        <span className="text-xs uppercase tracking-terminal">
                          EPA: {redEPA.toFixed(1)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {redTeams.map((teamKey) => {
                          const num = getTeamNumber(teamKey);
                          const stats = teamStats[num];
                          const isOurTeam = num === teamNumber;
                          return (
                            <div 
                              key={teamKey} 
                              className={`flex justify-between text-sm ${isOurTeam ? 'font-bold' : ''}`}
                            >
                              <span>{num}</span>
                              <span className="text-ink/70">
                                {stats?.epa?.total?.toFixed(1) || '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-3 border-t border-structure text-center">
                        <span className="text-lg font-bold">{redWinProb.toFixed(0)}%</span>
                        <span className="text-xs block uppercase tracking-terminal text-ink/70">WIN CHANCE</span>
                      </div>
                    </div>

                    {/* Blue Alliance */}
                    <div className={`border p-4 ${teamInBlue ? 'border-highlight bg-highlight/10' : 'border-structure'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold uppercase tracking-terminal text-blue-600">
                          BLUE ALLIANCE
                        </span>
                        <span className="text-xs uppercase tracking-terminal">
                          EPA: {blueEPA.toFixed(1)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {blueTeams.map((teamKey) => {
                          const num = getTeamNumber(teamKey);
                          const stats = teamStats[num];
                          const isOurTeam = num === teamNumber;
                          return (
                            <div 
                              key={teamKey} 
                              className={`flex justify-between text-sm ${isOurTeam ? 'font-bold' : ''}`}
                            >
                              <span>{num}</span>
                              <span className="text-ink/70">
                                {stats?.epa?.total?.toFixed(1) || '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-3 border-t border-structure text-center">
                        <span className="text-lg font-bold">{blueWinProb.toFixed(0)}%</span>
                        <span className="text-xs block uppercase tracking-terminal text-ink/70">WIN CHANCE</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchList;
