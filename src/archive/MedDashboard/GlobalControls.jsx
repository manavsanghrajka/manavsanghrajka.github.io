/**
 * GlobalControls — User input panel for the Med Dashboard
 * 
 * Collapsible, sticky panel with all applicant metric inputs.
 * Persists values to localStorage automatically.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'med_dashboard_profile';

const DEFAULT_PROFILE = {
  ucatScore: '',
  sjtBand: 1,
  top6Avg: '',
  chemGrade: '',
  bioGrade: '',
  feeStatus: 'international',
  entryType: 'undergraduate',
  viewMode: 'current',
};

const GlobalControls = ({ onProfileChange, fxRate, fxCached }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...DEFAULT_PROFILE, ...saved };
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    onProfileChange(profile);
  }, [profile, onProfileChange]);

  const updateField = useCallback((field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);
  const handleNumericChange = useCallback((field, value, min, max) => {
    if (value === '') {
      updateField(field, '');
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    // We only clamp max while typing, otherwise typing "2" clamps to "900" immediately
    updateField(field, Math.min(max, num));
  }, [updateField]);
  return (
    <div className="controls-panel">
      <div 
        className={`controls-panel__header ${collapsed ? '' : 'expanded'}`}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="controls-panel__label">[ Applicant Profile ]</span>
        <span className="controls-panel__toggle">
          {collapsed ? '[ ▼ EXPAND ]' : '[ ▲ COLLAPSE ]'}
        </span>
      </div>

      {!collapsed && (
        <div className="controls-grid">
          {/* UCAT Score */}
          <div className="control-group">
            <label htmlFor="ucat-score">UCAT Cognitive Score (900–2700)</label>
            <input
              id="ucat-score"
              type="number"
              min="900"
              max="2700"
              step="10"
              placeholder="e.g. 2200"
              value={profile.ucatScore}
              onChange={e => handleNumericChange('ucatScore', e.target.value, 900, 2700)}
            />
          </div>

          {/* SJT Band */}
          <div className="control-group">
            <label htmlFor="sjt-band">SJT Band</label>
            <select
              id="sjt-band"
              value={profile.sjtBand}
              onChange={e => updateField('sjtBand', parseInt(e.target.value))}
            >
              <option value={1}>Band 1</option>
              <option value={2}>Band 2</option>
              <option value={3}>Band 3</option>
              <option value={4}>Band 4</option>
            </select>
          </div>

          {/* Top 6 Average */}
          <div className="control-group">
            <label htmlFor="top6-avg">Top 6 Average (%)</label>
            <input
              id="top6-avg"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 92"
              value={profile.top6Avg}
              onChange={e => handleNumericChange('top6Avg', e.target.value, 0, 100)}
            />
          </div>

          {/* Chemistry */}
          <div className="control-group">
            <label htmlFor="chem-grade">Chemistry 4U (%)</label>
            <input
              id="chem-grade"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 94"
              value={profile.chemGrade}
              onChange={e => handleNumericChange('chemGrade', e.target.value, 0, 100)}
            />
          </div>

          {/* Biology */}
          <div className="control-group">
            <label htmlFor="bio-grade">Biology 4U (%)</label>
            <input
              id="bio-grade"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 90"
              value={profile.bioGrade}
              onChange={e => handleNumericChange('bioGrade', e.target.value, 0, 100)}
            />
          </div>

          {/* Fee Status */}
          <div className="control-group">
            <label>Fee Status</label>
            <div className="toggle-container">
              <span className={`toggle-label ${profile.feeStatus === 'home' ? '' : 'opacity-40'}`}>
                Home
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={profile.feeStatus === 'international'}
                  onChange={e => updateField('feeStatus', e.target.checked ? 'international' : 'home')}
                />
                <span className="toggle-slider" />
              </label>
              <span className={`toggle-label ${profile.feeStatus === 'international' ? '' : 'opacity-40'}`}>
                International
              </span>
            </div>
          </div>

          {/* Entry Type */}
          <div className="control-group">
            <label>Entry Type</label>
            <div className="toggle-container">
              <span className={`toggle-label ${profile.entryType === 'undergraduate' ? '' : 'opacity-40'}`}>
                Undergrad
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={profile.entryType === 'graduate'}
                  onChange={e => updateField('entryType', e.target.checked ? 'graduate' : 'undergraduate')}
                />
                <span className="toggle-slider" />
              </label>
              <span className={`toggle-label ${profile.entryType === 'graduate' ? '' : 'opacity-40'}`}>
                Graduate
              </span>
            </div>
          </div>

          {/* Score View Mode */}
          <div className="control-group">
            <label>Score Display</label>
            <div className="segmented-control">
              {['current', 'percentile', 'legacy'].map(mode => (
                <button
                  key={mode}
                  className={profile.viewMode === mode ? 'active' : ''}
                  onClick={() => updateField('viewMode', mode)}
                >
                  {mode === 'current' ? '2700' : mode === 'legacy' ? '3600' : '%ile'}
                </button>
              ))}
            </div>
          </div>

          {/* FX Rate Info */}
          <div className="control-group">
            <label>GBP → CAD Rate</label>
            <div className="fx-display">
              <span className={`fx-dot ${fxCached ? '' : 'stale'}`} />
              <span>
                £1 = C${fxRate?.toFixed(4) || '—'}
                {fxCached ? ' (cached)' : ' (live)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalControls;
