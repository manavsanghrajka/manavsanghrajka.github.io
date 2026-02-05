import { useState } from 'react';
import TeamModal from './TeamModal';

const TeamList = ({ teams, teamStats, scoutingData, eventKey, onScoutingUpdate }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [sortBy, setSortBy] = useState('number');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sortedTeams = [...teams].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'number':
        aVal = a.team_number;
        bVal = b.team_number;
        break;
      case 'epa':
        aVal = teamStats[a.team_number]?.epa?.total || 0;
        bVal = teamStats[b.team_number]?.epa?.total || 0;
        break;
      case 'shooter':
        aVal = scoutingData[a.team_number]?.shooter_type || 'zzz';
        bVal = scoutingData[b.team_number]?.shooter_type || 'zzz';
        break;
      case 'climb':
        aVal = scoutingData[a.team_number]?.climb || 'zzz';
        bVal = scoutingData[b.team_number]?.climb || 'zzz';
        break;
      case 'scouted':
        aVal = scoutingData[a.team_number] ? 1 : 0;
        bVal = scoutingData[b.team_number] ? 1 : 0;
        break;
      default:
        aVal = a.team_number;
        bVal = b.team_number;
    }

    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const SortButton = ({ field, label }) => (
    <button
      onClick={() => handleSort(field)}
      className={`text-xs uppercase tracking-terminal px-2 py-1 border transition-none ${
        sortBy === field 
          ? 'bg-highlight text-invert border-highlight' 
          : 'border-structure hover:bg-highlight hover:text-invert'
      }`}
    >
      {label} {sortBy === field && (sortDir === 'asc' ? '↑' : '↓')}
    </button>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Sort Controls */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        <span className="text-xs uppercase tracking-terminal text-ink/70 py-1">SORT BY:</span>
        <SortButton field="number" label="TEAM #" />
        <SortButton field="epa" label="EPA" />
        <SortButton field="shooter" label="SHOOTER" />
        <SortButton field="climb" label="CLIMB" />
        <SortButton field="scouted" label="SCOUTED" />
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedTeams.map((team) => {
          const stats = teamStats[team.team_number];
          const scout = scoutingData[team.team_number];
          
          return (
            <button
              key={team.team_number}
              onClick={() => setSelectedTeam(team)}
              className="border border-structure p-4 text-left hover:bg-highlight hover:text-invert hover:border-highlight transition-none group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-lg font-bold">{team.team_number}</span>
                {stats?.epa?.total && (
                  <span className="text-xs uppercase tracking-terminal bg-canvas group-hover:bg-highlight px-2 py-1 border border-structure group-hover:border-invert">
                    EPA: {stats.epa.total.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="text-xs uppercase tracking-terminal truncate mb-2">
                {team.nickname}
              </div>
              <div className="text-xs uppercase tracking-terminal text-ink/50 group-hover:text-invert/50">
                {scout ? (
                  <span className="text-green-600 group-hover:text-green-300">[*] SCOUTED</span>
                ) : (
                  <span>[ ] NOT SCOUTED</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Team Modal */}
      {selectedTeam && (
        <TeamModal
          team={selectedTeam}
          teamStats={teamStats[selectedTeam.team_number]}
          scoutingData={scoutingData[selectedTeam.team_number]}
          eventKey={eventKey}
          onClose={() => setSelectedTeam(null)}
          onSave={(data) => {
            onScoutingUpdate(selectedTeam.team_number, data);
          }}
        />
      )}
    </div>
  );
};

export default TeamList;
