import React from 'react';
import './MainMenu.css';

export default function MainMenu({ onPlay, onLeaderboard }) {
  return (
    <div className="main-menu" id="main-menu">
      {/* Ambient background */}
      <div className="main-menu__bg">
        <div className="main-menu__bg-circle" />
        <div className="main-menu__bg-circle" />
        <div className="main-menu__bg-circle" />
      </div>

      <div className="main-menu__content">
        <h1 className="main-menu__title">
          ZEN<span className="main-menu__title-accent"> SLICER</span>
        </h1>
        <p className="main-menu__subtitle">Slice · Score · Survive</p>

        <div className="main-menu__actions">
          <button
            className="btn-primary"
            id="btn-play"
            onClick={onPlay}
          >
            START
          </button>

          <button
            className="btn-secondary"
            id="btn-leaderboard"
            onClick={onLeaderboard}
          >
            LEADERBOARD
          </button>
        </div>


      </div>
    </div>
  );
}
