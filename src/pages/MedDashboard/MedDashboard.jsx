/**
 * MedDashboard — Main page component for the UK Medical School Admissions Dashboard
 * 
 * Assembles GlobalControls + SchoolGrid + Legend.
 * Loads data from Supabase or local seed data, fetches exchange rate.
 */

import { useState, useEffect, useCallback } from 'react';
import GlobalControls from './GlobalControls';
import SchoolGrid from './SchoolGrid';
import medicalSchoolsData from '../../data/medicalSchoolsData';
import { fetchSchoolsFromDb, isBackendConfigured } from '../../lib/medschoolSupabase';
import { getGbpToCadRate } from '../../lib/exchangeRate';
import { scoreToPercentile } from '../../lib/medDashboard/ucatEngine';
import './MedDashboard.css';

const MedDashboard = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [fxRate, setFxRate] = useState(null);
  const [fxCached, setFxCached] = useState(false);

  // Load school data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      // Try Supabase first, fall back to local data
      if (isBackendConfigured()) {
        const dbData = await fetchSchoolsFromDb();
        if (dbData?.length) {
          setSchools(dbData);
          setLoading(false);
          return;
        }
      }
      
      // Use local seed data
      setSchools(medicalSchoolsData);
      setLoading(false);
    }
    
    loadData();
  }, []);

  // Fetch exchange rate
  useEffect(() => {
    async function loadRate() {
      const result = await getGbpToCadRate();
      setFxRate(result.rate);
      setFxCached(result.cached);
    }
    loadRate();
  }, []);

  const handleProfileChange = useCallback((profile) => {
    setUserProfile({
      ucatScore: profile.ucatScore ? Number(profile.ucatScore) : null,
      sjtBand: Number(profile.sjtBand),
      top6Avg: profile.top6Avg ? Number(profile.top6Avg) : null,
      chemGrade: profile.chemGrade ? Number(profile.chemGrade) : null,
      bioGrade: profile.bioGrade ? Number(profile.bioGrade) : null,
      feeStatus: profile.feeStatus,
      entryType: profile.entryType || 'undergraduate',
      viewMode: profile.viewMode,
    });
  }, []);

  // Compute user's percentile for display
  const userPercentile = userProfile?.ucatScore
    ? scoreToPercentile(userProfile.ucatScore, 'current')
    : null;

  return (
    <main className="med-dashboard flex-grow">
      {/* Header */}
      <div className="med-dashboard__header">
        <h1 className="med-dashboard__title">
          [ UK Medical School Admissions Dashboard ]
        </h1>
        <p className="med-dashboard__subtitle">
          UCAT Score Analysis & Admissions Probability — 2027 Entry Cycle
        </p>
        {userProfile?.ucatScore && (
          <p className="med-dashboard__subtitle" style={{ marginTop: '0.5rem', opacity: 0.8 }}>
            Your UCAT: {userProfile.ucatScore}/2700 — Percentile: P{userPercentile} —
            SJT: Band {userProfile.sjtBand} —
            OSSD: {userProfile.top6Avg || '—'}%
          </p>
        )}
      </div>

      {/* Controls */}
      <GlobalControls
        onProfileChange={handleProfileChange}
        fxRate={fxRate}
        fxCached={fxCached}
      />

      {/* Legend */}
      <div className="legend">
        <div className="legend__item">
          <span className="legend__swatch legend__swatch--blue" />
          Top 1% — Exceeds offer avg
        </div>
        <div className="legend__item">
          <span className="legend__swatch legend__swatch--dark-green" />
          Top 10% — Exceeds interview avg
        </div>
        <div className="legend__item">
          <span className="legend__swatch legend__swatch--light-green" />
          Top 25% — Meets interview avg
        </div>
        <div className="legend__item">
          <span className="legend__swatch legend__swatch--yellow" />
          Top 75% — Between cutoff & avg
        </div>
        <div className="legend__item">
          <span className="legend__swatch legend__swatch--red" />
          Below cutoff — Fails threshold
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
          <p className="text-sm uppercase tracking-terminal">Loading medical school data...</p>
        </div>
      ) : (
        <SchoolGrid
          schools={schools}
          userProfile={userProfile}
          viewMode={userProfile?.viewMode || 'current'}
          feeStatus={userProfile?.feeStatus || 'international'}
          fxRate={fxRate}
        />
      )}

      {/* Footer info */}
      <div style={{
        textAlign: 'center',
        padding: '1rem',
        borderTop: '1px dotted var(--color-structure)',
        marginTop: '1rem',
      }}>
        <p style={{ fontSize: '0.65rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Data compiled from TheUKCATPeople, official university pages, and verified aggregators.
          Always verify against each university's official admissions page. Last updated: Aug 2026.
        </p>
        {!isBackendConfigured() && (
          <p style={{ fontSize: '0.6rem', opacity: 0.3, marginTop: '0.25rem', textTransform: 'uppercase' }}>
            Running with local seed data — Supabase backend not configured
          </p>
        )}
      </div>
    </main>
  );
};

export default MedDashboard;
