'use client';

import { useState, useEffect } from 'react';

interface DopamineBarProps {
  className?: string;
}

interface GamificationStats {
  xp: number;
  level: number;
  currentStreak: number;
  xpProgress: number;
  xpForNextLevel: number;
}

export default function DopamineBar({ className = '' }: DopamineBarProps) {
  const [stats, setStats] = useState<GamificationStats>({
    xp: 0,
    level: 1,
    currentStreak: 0,
    xpProgress: 0,
    xpForNextLevel: 1000
  });
  const [loading, setLoading] = useState(true);
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);

  useEffect(() => {
    loadStats();
    claimDailyLogin();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/progress');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load gamification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimDailyLogin = async () => {
    try {
      const localDate = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/progress/daily-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localDate })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.claimed) {
          // Show daily login toast
          import('sonner').then(({ toast }) => {
            toast.success('Daily Login Bonus! +20 XP 🌟', {
              duration: 3000
            });
          });
          loadStats(); // Refresh stats
        }
      }
    } catch (error) {
      console.error('Failed to claim daily login:', error);
    }
  };

  // Listen for XP updates from other components
  useEffect(() => {
    const handleXpUpdate = (event: CustomEvent<{ leveledUp: boolean }>) => {
      loadStats();
      if (event.detail?.leveledUp) {
        triggerLevelUpAnimation();
      }
    };

    window.addEventListener('xp-update' as any, handleXpUpdate);
    return () => window.removeEventListener('xp-update' as any, handleXpUpdate);
  }, []);

  const triggerLevelUpAnimation = () => {
    setLevelUpAnimation(true);
    setTimeout(() => setLevelUpAnimation(false), 2000);
  };

  if (loading) {
    return (
      <div className={`dopamine-bar ${className}`}>
        <div className="dopamine-bar-inner">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="flex-1 mx-4">
            <div className="skeleton h-3 w-full rounded-full" />
          </div>
          <div className="skeleton w-16 h-8 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Level Up Celebration Overlay */}
      {levelUpAnimation && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
          <div className="level-up-celebration animate-fadeIn">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <div className="text-h1 font-bold" style={{ color: 'var(--accent-light)' }}>
                LEVEL UP!
              </div>
              <div className="text-h2" style={{ color: 'var(--text-primary)' }}>
                Level {stats.level}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dopamine Bar */}
      <div className={`dopamine-bar ${className}`}>
        <div className="dopamine-bar-inner">
          {/* Level Badge */}
          <div 
            className="level-badge"
            style={{
              background: levelUpAnimation 
                ? 'linear-gradient(135deg, var(--accent), var(--accent-light))' 
                : 'var(--bg-surface)',
              boxShadow: levelUpAnimation ? '0 0 20px var(--accent-glow)' : 'none'
            }}
          >
            <span className="text-caption font-bold" style={{ color: 'var(--text-muted)' }}>
              LVL
            </span>
            <span className="text-h3 font-bold" style={{ color: 'var(--accent-light)' }}>
              {stats.level}
            </span>
          </div>

          {/* XP Progress Bar */}
          <div className="flex-1 mx-4">
            <div className="flex justify-between mb-1">
              <span className="text-caption" style={{ color: 'var(--text-muted)' }}>
                {stats.xp.toLocaleString()} XP
              </span>
              <span className="text-caption" style={{ color: 'var(--text-muted)' }}>
                {stats.xpForNextLevel.toLocaleString()} XP
              </span>
            </div>
            <div className="xp-progress-track">
              <div 
                className="xp-progress-fill"
                style={{ 
                  width: `${stats.xpProgress}%`,
                  transition: 'width 0.5s ease-out'
                }}
              />
            </div>
          </div>

          {/* Streak Fire */}
          <div className="streak-badge">
            <span className="text-xl">🔥</span>
            <span className="text-body font-bold" style={{ color: 'var(--warning)' }}>
              {stats.currentStreak}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// Utility function to award XP from other components
export async function awardXP(amount: number, action: string): Promise<{ success: boolean; leveledUp: boolean }> {
  try {
    const res = await fetch('/api/progress/xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, action })
    });

    if (res.ok) {
      const data = await res.json();
      
      // Dispatch event for DopamineBar to update
      window.dispatchEvent(new CustomEvent('xp-update', { 
        detail: { leveledUp: data.leveled_up }
      }));

      return { success: true, leveledUp: data.leveled_up };
    }
    return { success: false, leveledUp: false };
  } catch (error) {
    console.error('Failed to award XP:', error);
    return { success: false, leveledUp: false };
  }
}
