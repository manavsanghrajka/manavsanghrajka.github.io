import React, { useEffect, useState } from 'react';
import { fetchLeaderboard, isSupabaseConfigured } from '../lib/supabase.js';
import './Leaderboard.css';

export default function Leaderboard({ onBack }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const data = await fetchLeaderboard();
        if (!cancelled) {
          setScores(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [configured]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getRankDisplay = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <div className="leaderboard" id="leaderboard-screen">
      <div className="leaderboard__header">
        <h2 className="leaderboard__title">Leaderboard</h2>
        <button
          className="leaderboard__back"
          id="btn-leaderboard-back"
          onClick={onBack}
        >
          ← Back
        </button>
      </div>

      <div className="leaderboard__table-wrapper">
        {!configured && (
          <div className="leaderboard__empty">
            <span className="leaderboard__empty-icon">⚙️</span>
            <p>Leaderboard not configured.</p>
            <p style={{ marginTop: '8px', fontSize: '12px' }}>
              Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
            </p>
          </div>
        )}

        {configured && loading && (
          <div className="leaderboard__loading">
            <span className="leaderboard__loading-spinner" />
            <p>Loading scores...</p>
          </div>
        )}

        {configured && error && (
          <div className="leaderboard__empty">
            <span className="leaderboard__empty-icon">❌</span>
            <p>Failed to load leaderboard</p>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-danger)' }}>
              {error}
            </p>
          </div>
        )}

        {configured && !loading && !error && scores.length === 0 && (
          <div className="leaderboard__empty">
            <span className="leaderboard__empty-icon">🍉</span>
            <p>No scores yet. Be the first!</p>
          </div>
        )}

        {configured && !loading && !error && scores.length > 0 && (
          <table className="leaderboard__table" id="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Date</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((entry, i) => (
                <tr key={entry.id} className="leaderboard__row">
                  <td className={`leaderboard__rank--${i + 1}`}>
                    {getRankDisplay(i)}
                  </td>
                  <td>{entry.player_name}</td>
                  <td className="leaderboard__date">
                    {formatDate(entry.created_at)}
                  </td>
                  <td>{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
