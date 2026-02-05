import { useState } from 'react';
import { upsertScoutingData, SHOOTER_TYPES, CLIMB_OPTIONS } from '../../lib/scouting';

const TeamModal = ({ team, teamStats, scoutingData, eventKey, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    shooter_type: scoutingData?.shooter_type || '',
    hopper_capacity: scoutingData?.hopper_capacity || '',
    autos: scoutingData?.autos || '',
    feeding: scoutingData?.feeding || false,
    climb: scoutingData?.climb || '',
    trench: scoutingData?.trench || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const dataToSave = {
        team_number: team.team_number,
        competition_key: eventKey,
        shooter_type: formData.shooter_type || null,
        hopper_capacity: formData.hopper_capacity ? parseInt(formData.hopper_capacity) : null,
        autos: formData.autos || null,
        feeding: formData.feeding,
        climb: formData.climb || null,
        trench: formData.trench,
        updated_at: new Date().toISOString(),
      };
      const saved = await upsertScoutingData(dataToSave);
      onSave(saved);
      onClose();
    } catch (err) {
      setError('Failed to save data');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/80 flex items-center justify-center z-50 p-4">
      <div className="bg-canvas border border-structure w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-structure p-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-terminal">
              {team.team_number}
            </h2>
            <p className="text-sm text-ink/70 uppercase tracking-terminal">
              {team.nickname}
            </p>
            {teamStats?.epa?.total && (
              <p className="text-xs text-ink/50 uppercase tracking-terminal mt-1">
                EPA: {teamStats.epa.total.toFixed(1)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-ink hover:bg-highlight hover:text-invert px-3 py-1 border border-structure transition-none"
          >
            [ X ]
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Shooter Type */}
          <div>
            <label className="block text-xs uppercase tracking-terminal mb-2 text-ink/70">
              SHOOTER TYPE
            </label>
            <select
              value={formData.shooter_type}
              onChange={(e) => handleChange('shooter_type', e.target.value)}
              className="w-full bg-canvas border border-structure p-3 text-sm font-mono"
            >
              <option value="">-- Select --</option>
              {SHOOTER_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Hopper Capacity */}
          <div>
            <label className="block text-xs uppercase tracking-terminal mb-2 text-ink/70">
              HOPPER CAPACITY
            </label>
            <input
              type="number"
              value={formData.hopper_capacity}
              onChange={(e) => handleChange('hopper_capacity', e.target.value)}
              className="w-full bg-canvas border border-structure p-3 text-sm font-mono"
              placeholder="Number of game pieces"
              min="0"
            />
          </div>

          {/* Climb */}
          <div>
            <label className="block text-xs uppercase tracking-terminal mb-2 text-ink/70">
              CLIMB LEVEL
            </label>
            <div className="flex gap-2">
              {CLIMB_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => handleChange('climb', option)}
                  className={`flex-1 p-3 text-sm uppercase tracking-terminal border transition-none ${
                    formData.climb === option
                      ? 'bg-highlight text-invert border-highlight'
                      : 'border-structure hover:bg-highlight hover:text-invert'
                  }`}
                >
                  {formData.climb === option ? '[*]' : '[ ]'} {option}
                </button>
              ))}
            </div>
          </div>

          {/* Feeding */}
          <div
            onClick={() => handleChange('feeding', !formData.feeding)}
            className={`p-3 border cursor-pointer transition-none ${
              formData.feeding
                ? 'bg-highlight text-invert border-highlight'
                : 'border-structure hover:bg-highlight hover:text-invert'
            }`}
          >
            <span className="text-sm uppercase tracking-terminal font-semibold">
              {formData.feeding ? '[*]' : '[ ]'} FEEDING CAPABILITY
            </span>
          </div>

          {/* Trench */}
          <div
            onClick={() => handleChange('trench', !formData.trench)}
            className={`p-3 border cursor-pointer transition-none ${
              formData.trench
                ? 'bg-highlight text-invert border-highlight'
                : 'border-structure hover:bg-highlight hover:text-invert'
            }`}
          >
            <span className="text-sm uppercase tracking-terminal font-semibold">
              {formData.trench ? '[*]' : '[ ]'} CAN GO UNDER TRENCH
            </span>
          </div>

          {/* Autos */}
          <div>
            <label className="block text-xs uppercase tracking-terminal mb-2 text-ink/70">
              AUTONOMOUS PATHS
            </label>
            <textarea
              value={formData.autos}
              onChange={(e) => handleChange('autos', e.target.value)}
              className="w-full bg-canvas border border-structure p-3 text-sm font-mono min-h-[100px] resize-none"
              placeholder="Describe auto paths..."
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 uppercase tracking-terminal">
              [ {error} ]
            </p>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-highlight text-invert p-4 text-sm uppercase tracking-terminal font-semibold hover:bg-ink transition-none disabled:opacity-50"
          >
            {saving ? '[ SAVING... ]' : '[ SAVE SCOUTING DATA ]'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamModal;
