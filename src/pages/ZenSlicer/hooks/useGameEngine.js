// useGameEngine — React hook bridging the imperative game engine with React state
import { useRef, useState, useCallback, useEffect } from 'react';
import { GameEngine } from '../engine/GameEngine.js';

export function useGameEngine(canvasRef) {
  const engineRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [gameState, setGameState] = useState('IDLE'); // IDLE | PLAYING | GAME_OVER
  const [gameOverData, setGameOverData] = useState(null);
  const [lastCombo, setLastCombo] = useState(null);

  // Initialize engine when canvas is available
  const initEngine = useCallback(() => {
    if (!canvasRef.current || engineRef.current) return;

    const canvas = canvasRef.current;
    const engine = new GameEngine(canvas);

    // Wire up callbacks
    engine.onScoreChange = (s) => setScore(s);
    engine.onLivesChange = (l) => setLives(l);
    engine.onTimeChange = (t) => setTimeRemaining(t);
    engine.onGameOver = (reason, stats) => {
      setGameState('GAME_OVER');
      setGameOverData({ reason, stats });
    };
    engine.onComboHit = (count) => {
      setLastCombo({ count, time: Date.now() });
    };

    engineRef.current = engine;
  }, [canvasRef]);

  const startGame = useCallback(() => {
    if (!engineRef.current) return;

    setScore(0);
    setLives(3);
    setTimeRemaining(45);
    setGameState('PLAYING');
    setGameOverData(null);
    setLastCombo(null);

    engineRef.current.start();
  }, []);

  const restartGame = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.destroy();

    // Reinitialize
    const canvas = canvasRef.current;
    const engine = new GameEngine(canvas);
    engine.onScoreChange = (s) => setScore(s);
    engine.onLivesChange = (l) => setLives(l);
    engine.onTimeChange = (t) => setTimeRemaining(t);
    engine.onGameOver = (reason, stats) => {
      setGameState('GAME_OVER');
      setGameOverData({ reason, stats });
    };
    engine.onComboHit = (count) => {
      setLastCombo({ count, time: Date.now() });
    };
    engineRef.current = engine;

    setScore(0);
    setLives(3);
    setTimeRemaining(45);
    setGameState('PLAYING');
    setGameOverData(null);
    setLastCombo(null);

    engine.start();
  }, [canvasRef]);

  const getGameStats = useCallback(() => {
    if (!engineRef.current) return null;
    return engineRef.current.getStats();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return {
    score,
    lives,
    timeRemaining,
    gameState,
    gameOverData,
    lastCombo,
    initEngine,
    startGame,
    restartGame,
    getGameStats,
    engineRef,
  };
}
