import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import './GameScreen.css';

const MAX_LIVES = 3;

export default function GameScreen({ onGameOver, onBack }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const {
    score,
    lives,
    gameState,
    gameOverData,
    initEngine,
    startGame,
    getGameStats,
    engineRef,
  } = useGameEngine(canvasRef);

  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [prevScore, setPrevScore] = useState(0);
  const [prevLives, setPrevLives] = useState(MAX_LIVES);
  const [scorePulse, setScorePulse] = useState(false);
  const [heartLost, setHeartLost] = useState(-1);

  // Resize canvas to fill container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Update internal canvas dimensions used by engine (logical pixels)
    canvas._logicalWidth = width;
    canvas._logicalHeight = height;

    if (engineRef.current) {
      engineRef.current.resize(width, height);
    }
  }, [engineRef]);

  // Initialize
  useEffect(() => {
    resizeCanvas();
    initEngine();

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas, initEngine]);

  // Countdown then start
  useEffect(() => {
    if (!isCountingDown) return;

    if (countdown <= 0) {
      setIsCountingDown(false);
      startGame();
      return;
    }

    const timer = setTimeout(() => setCountdown(c => c - 1), 800);
    return () => clearTimeout(timer);
  }, [countdown, isCountingDown, startGame]);

  // Detect score change → pulse
  useEffect(() => {
    if (score > prevScore) {
      setScorePulse(true);
      const timer = setTimeout(() => setScorePulse(false), 150);
      setPrevScore(score);
      return () => clearTimeout(timer);
    }
    setPrevScore(score);
  }, [score, prevScore]);

  // Detect life lost → animate heart
  useEffect(() => {
    if (lives < prevLives) {
      setHeartLost(lives); // index of the heart that was just lost
      const timer = setTimeout(() => setHeartLost(-1), 400);
      setPrevLives(lives);
      return () => clearTimeout(timer);
    }
    setPrevLives(lives);
  }, [lives, prevLives]);

  // Game over detection
  useEffect(() => {
    if (gameState === 'GAME_OVER' && gameOverData) {
      // Short delay to show final state
      const timer = setTimeout(() => {
        onGameOver(gameOverData.stats);
      }, gameOverData.reason === 'bomb' ? 800 : 400);
      return () => clearTimeout(timer);
    }
  }, [gameState, gameOverData, onGameOver]);

  return (
    <div className="game-screen" ref={containerRef} id="game-screen">
      <canvas
        ref={canvasRef}
        className="game-screen__canvas"
        id="game-canvas"
      />

      {/* HUD Overlay */}
      {!isCountingDown && (
        <div className="game-hud">
          <div
            className={`hud-score ${scorePulse ? 'hud-score--pulse' : ''}`}
            id="hud-score"
          >
            {score}
          </div>

          <div className="hud-lives" id="hud-lives">
            {Array.from({ length: MAX_LIVES }, (_, i) => {
              const isActive = i < lives;
              const justLost = heartLost === i || (heartLost >= 0 && i === lives);
              return (
                <span
                  key={i}
                  className={`hud-heart ${isActive ? 'hud-heart--active' : 'hud-heart--lost'} ${justLost ? 'hud-heart--just-lost' : ''}`}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Countdown overlay */}
      {isCountingDown && countdown > 0 && (
        <div className="game-countdown">
          <span className="game-countdown__number" key={countdown}>
            {countdown}
          </span>
        </div>
      )}
    </div>
  );
}
