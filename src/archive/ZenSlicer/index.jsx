import React, { useState, useCallback } from 'react';
import MainMenu from './components/MainMenu.jsx';
import GameScreen from './components/GameScreen.jsx';
import GameOver from './components/GameOver.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import './ZenSlicer.css';

// Screens: menu | playing | gameover | leaderboard
function ZenSlicer() {
  const [screen, setScreen] = useState('menu');
  const [gameStats, setGameStats] = useState(null);

  const handlePlay = useCallback(() => {
    setScreen('playing');
    setGameStats(null);
  }, []);

  const handleGameOver = useCallback((stats) => {
    setGameStats(stats);
    setScreen('gameover');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setScreen('playing');
    setGameStats(null);
  }, []);

  const handleMainMenu = useCallback(() => {
    setScreen('menu');
    setGameStats(null);
  }, []);

  const handleLeaderboard = useCallback(() => {
    setScreen('leaderboard');
  }, []);

  return (
    <div className="zenslicer-app" id="zenslicer-root">
      {screen === 'menu' && (
        <MainMenu onPlay={handlePlay} onLeaderboard={handleLeaderboard} />
      )}

      {screen === 'playing' && (
        <GameScreen
          onGameOver={handleGameOver}
          onBack={handleMainMenu}
        />
      )}

      {screen === 'gameover' && (
        <GameOver
          stats={gameStats}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
        />
      )}

      {screen === 'leaderboard' && (
        <Leaderboard onBack={handleMainMenu} />
      )}
    </div>
  );
}

export default ZenSlicer;
