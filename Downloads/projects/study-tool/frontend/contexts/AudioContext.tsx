'use client';

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';

interface AudioState {
  isPlaying: boolean;
  currentTrack: {
    url: string;
    topicName: string;
    topicId: string;
  } | null;
  isLoading: boolean;
  loadingTopicId: string | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
}

interface AudioContextType extends AudioState {
  play: (url: string, topicName: string, topicId: string) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  setSpeed: (rate: number) => void;
  generateAndPlay: (topicId: string, topicName: string, contextText?: string) => Promise<void>;
  close: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTrack: null,
    isLoading: false,
    loadingTopicId: null,
    currentTime: 0,
    duration: 0,
    playbackRate: 1
  });

  // Initialize audio element
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('timeupdate', () => {
        setState(prev => ({ ...prev, currentTime: audioRef.current?.currentTime || 0 }));
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        setState(prev => ({ ...prev, duration: audioRef.current?.duration || 0 }));
      });
      audioRef.current.addEventListener('ended', () => {
        setState(prev => ({ ...prev, isPlaying: false }));
      });
      audioRef.current.addEventListener('play', () => {
        setState(prev => ({ ...prev, isPlaying: true }));
      });
      audioRef.current.addEventListener('pause', () => {
        setState(prev => ({ ...prev, isPlaying: false }));
      });
    }
    return audioRef.current;
  }, []);

  const play = useCallback((url: string, topicName: string, topicId: string) => {
    const audio = getAudio();
    audio.src = url;
    audio.playbackRate = state.playbackRate;
    audio.play();
    setState(prev => ({
      ...prev,
      currentTrack: { url, topicName, topicId },
      isPlaying: true,
      isLoading: false,
      loadingTopicId: null
    }));
  }, [getAudio, state.playbackRate]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [state.isPlaying, pause, resume]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
    }
  }, []);

  const setSpeed = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  const close = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTrack: null,
      currentTime: 0,
      duration: 0
    }));
  }, []);

  const generateAndPlay = useCallback(async (topicId: string, topicName: string, contextText?: string) => {
    setState(prev => ({ ...prev, isLoading: true, loadingTopicId: topicId }));

    try {
      const response = await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, topicName, contextText })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      play(data.audioUrl, topicName, topicId);
    } catch (error) {
      console.error('Audio generation failed:', error);
      setState(prev => ({ ...prev, isLoading: false, loadingTopicId: null }));
    }
  }, [play]);

  return (
    <AudioContext.Provider value={{
      ...state,
      play,
      pause,
      resume,
      togglePlay,
      seek,
      skip,
      setSpeed,
      generateAndPlay,
      close
    }}>
      {children}
    </AudioContext.Provider>
  );
}
