'use client';

import { ReactNode } from 'react';
import { AudioProvider } from '@/contexts/AudioContext';

// Providers wrapper - includes AudioProvider for Commute Mode
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AudioProvider>
      {children}
    </AudioProvider>
  );
}
