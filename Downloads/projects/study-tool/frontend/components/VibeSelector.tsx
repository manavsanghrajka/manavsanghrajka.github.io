'use client';

import { useState } from 'react';

export type VibePesona = 'roast' | 'eli5' | 'professional';

interface VibeOption {
  id: VibePesona;
  name: string;
  emoji: string;
  description: string;
  example: string;
}

const VIBE_OPTIONS: VibeOption[] = [
  {
    id: 'roast',
    name: 'THE ROAST MASTER',
    emoji: '🔥',
    description: 'Brutally honest feedback that keeps you on your toes',
    example: '"You missed that? My grandma knows better."'
  },
  {
    id: 'eli5',
    name: 'THE GEN-Z BESTIE',
    emoji: '🧢',
    description: 'Casual, relatable explanations with modern slang',
    example: '"No cap, mitochondria is the powerhouse fr fr."'
  },
  {
    id: 'professional',
    name: 'THE PROFESSOR',
    emoji: '📚',
    description: 'Clear, academic explanations with proper terminology',
    example: '"The mitochondrion generates ATP through oxidative phosphorylation."'
  }
];

interface VibeSelectorProps {
  value: VibePesona;
  onChange: (vibe: VibePesona) => void;
  disabled?: boolean;
}

export default function VibeSelector({ value, onChange, disabled = false }: VibeSelectorProps) {
  const [hoveredId, setHoveredId] = useState<VibePesona | null>(null);

  return (
    <div className="space-y-4">
      <div 
        className="text-caption mb-4"
        style={{ color: 'var(--text-dim)' }}
      >
        [ SELECT YOUR AI TUTOR VIBE ]
      </div>
      
      <div className="grid gap-3">
        {VIBE_OPTIONS.map((option) => {
          const isSelected = value === option.id;
          const isHovered = hoveredId === option.id;
          
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.id)}
              onMouseEnter={() => setHoveredId(option.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="text-left p-4 transition-none"
              style={{
                border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--border)'}`,
                background: isSelected ? 'var(--active-bg)' : 'transparent',
                color: isSelected ? 'var(--active-text)' : 'var(--text-primary)',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'crosshair'
              }}
            >
              <div className="flex items-start gap-3">
                {/* Selection indicator */}
                <span 
                  className="text-sm font-mono"
                  style={{ color: isSelected ? 'var(--active-text)' : 'var(--text-muted)' }}
                >
                  {isSelected ? '[x]' : '[ ]'}
                </span>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{option.emoji}</span>
                    <span 
                      className="font-mono text-sm font-semibold uppercase tracking-wide"
                      style={{ color: isSelected ? 'var(--active-text)' : 'var(--text-primary)' }}
                    >
                      {option.name}
                    </span>
                  </div>
                  
                  <p 
                    className="text-sm mb-2"
                    style={{ color: isSelected ? 'var(--active-text)' : 'var(--text-secondary)' }}
                  >
                    {option.description}
                  </p>
                  
                  <p 
                    className="text-xs font-mono italic"
                    style={{ 
                      color: isSelected ? 'var(--active-text)' : 'var(--text-muted)',
                      opacity: 0.8
                    }}
                  >
                    {option.example}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
