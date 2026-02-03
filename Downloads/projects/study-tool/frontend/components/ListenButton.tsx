'use client';

import { useAudio } from '@/contexts/AudioContext';

interface ListenButtonProps {
  topicId: string;
  topicName: string;
  contextText?: string;
  compact?: boolean;
}

export default function ListenButton({ 
  topicId, 
  topicName, 
  contextText,
  compact = false 
}: ListenButtonProps) {
  const { 
    isLoading, 
    loadingTopicId, 
    currentTrack, 
    isPlaying,
    generateAndPlay,
    togglePlay
  } = useAudio();

  const isThisLoading = isLoading && loadingTopicId === topicId;
  const isThisPlaying = currentTrack?.topicId === topicId && isPlaying;
  const isThisPaused = currentTrack?.topicId === topicId && !isPlaying;

  const handleClick = () => {
    if (isThisPlaying || isThisPaused) {
      togglePlay();
    } else {
      generateAndPlay(topicId, topicName, contextText);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={isThisLoading}
        className="listen-btn-compact"
        title={isThisPlaying ? 'Pause' : isThisLoading ? 'Generating...' : 'Listen'}
      >
        {isThisLoading ? (
          <span className="spinner spinner-sm" />
        ) : isThisPlaying ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
          </svg>
        ) : (
          <span className="text-lg">🎧</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isThisLoading}
      className="listen-btn"
    >
      {isThisLoading ? (
        <>
          <span className="spinner spinner-sm" />
          <span>Generating...</span>
        </>
      ) : isThisPlaying ? (
        <>
          <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span>Playing</span>
        </>
      ) : isThisPaused ? (
        <>
          <span className="text-lg">🎧</span>
          <span>Resume</span>
        </>
      ) : (
        <>
          <span className="text-lg">🎧</span>
          <span>Listen</span>
        </>
      )}
    </button>
  );
}
