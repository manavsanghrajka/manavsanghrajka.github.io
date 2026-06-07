import React, { useState } from 'react';
import { submitScore, isSupabaseConfigured } from '../lib/supabase.js';
import './GameOver.css';

export default function GameOver({ stats, onPlayAgain, onMainMenu }) {
  const [playerName, setPlayerName] = useState('');
  const [submitState, setSubmitState] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const isBomb = stats?.endReason === 'bomb';
  const supabaseReady = isSupabaseConfigured();

  const handleSubmit = async () => {
    const name = playerName.trim();
    if (!name) return;
    if (submitState === 'loading' || submitState === 'success') return;

    setSubmitState('loading');
    setErrorMsg('');

    const result = await submitScore(name, stats);

    if (result.success) {
      setSubmitState('success');
    } else {
      setSubmitState('error');
      setErrorMsg(result.error || 'Failed to submit score');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="game-over-overlay" id="game-over-overlay">
      <div className="game-over-card">
        <h2 className={`game-over__title ${isBomb ? 'game-over__title--bomb' : ''}`}>
          {isBomb ? 'BOOM!' : 'GAME OVER'}
        </h2>

        <div className="game-over__score-section">
          <span className="game-over__score-label">Final Score</span>
          <span className="game-over__score-value">{stats?.score ?? 0}</span>
        </div>

        <div className="game-over__stats">
          <div className="game-over__stat">
            <span className="game-over__stat-value">{stats?.fruitsSliced ?? 0}</span>
            <span className="game-over__stat-label">Sliced</span>
          </div>
          <div className="game-over__stat">
            <span className="game-over__stat-value">{stats?.fruitsSpawned ?? 0}</span>
            <span className="game-over__stat-label">Spawned</span>
          </div>
          <div className="game-over__stat">
            <span className="game-over__stat-value">{Math.floor(stats?.elapsedTime ?? 0)}s</span>
            <span className="game-over__stat-label">Time</span>
          </div>
        </div>

        {/* Name input & submit */}
        {supabaseReady && submitState !== 'success' && (
          <div className="game-over__input-group">
            <label className="game-over__input-label" htmlFor="player-name-input">
              Enter your name for the leaderboard:
            </label>
            <input
              id="player-name-input"
              className="game-over__input"
              type="text"
              maxLength={20}
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={submitState === 'loading'}
              autoComplete="off"
            />
          </div>
        )}

        <div className="game-over__actions">
          {supabaseReady && submitState !== 'success' && (
            <button
              className="btn-primary"
              id="btn-submit-score"
              onClick={handleSubmit}
              disabled={!playerName.trim() || submitState === 'loading'}
              style={{ opacity: (!playerName.trim() || submitState === 'loading') ? 0.5 : 1 }}
            >
              {submitState === 'loading' ? 'SUBMITTING...' : 'SUBMIT SCORE'}
            </button>
          )}

          {submitState === 'success' && (
            <p className="game-over__status game-over__status--success">
              Score submitted!
            </p>
          )}

          {submitState === 'error' && (
            <p className="game-over__status game-over__status--error">
              {errorMsg}
            </p>
          )}

          <button
            className="btn-primary"
            id="btn-play-again"
            onClick={onPlayAgain}
          >
            PLAY AGAIN
          </button>

          <button
            className="btn-secondary"
            id="btn-main-menu"
            onClick={onMainMenu}
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
