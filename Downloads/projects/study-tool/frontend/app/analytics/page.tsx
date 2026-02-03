'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

interface Analytics {
  studyStreak: number;
  totalStudyTime: number;
  topicsCompleted: number;
  averageScore: number;
  recentScores: { date: string; score: number }[];
  topicMastery: { topic: string; mastery: number }[];
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// Default analytics when no data is available
const defaultAnalytics: Analytics = {
  studyStreak: 0,
  totalStudyTime: 0,
  topicsCompleted: 0,
  averageScore: 0,
  recentScores: [],
  topicMastery: []
};

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics>(defaultAnalytics);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      await loadAnalytics();
      await checkAdminStatus();
      setLoading(false);
    };
    init();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const res = await fetch('/api/admin/check');
      const data = await res.json();
      setIsAdmin(data.isAdmin === true);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/insights');
      if (res.ok) {
        const data = await res.json();
        setAnalytics({
          studyStreak: data.studyStreak || 0,
          totalStudyTime: data.totalStudyTime || 0,
          topicsCompleted: data.topicsCompleted || 0,
          averageScore: data.averageScore || 0,
          recentScores: data.recentScores || [],
          topicMastery: data.topicMastery || []
        });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Keep default analytics
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <header className="floating-header">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </header>
        <main className="pt-24 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="metric-card">
                <Skeleton className="h-10 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Generate weekly progress from recent scores or show default
  const weeklyProgress = analytics.recentScores.length > 0 
    ? analytics.recentScores.slice(0, 7).map((s, i) => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i % 7],
        minutes: Math.round(s.score / 2) // Convert score to estimated minutes
      }))
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ day, minutes: 0 }));

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Floating Header */}
      <header className="floating-header">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <h1 className="text-h3 font-bold" style={{ color: 'var(--accent-light)' }}>Hyperlapse</h1>

            {/* Navigation Pills */}
            <nav className="flex items-center gap-1">
              <button 
                onClick={() => router.push('/dashboard')}
                className="nav-pill"
              >
                Dashboard
              </button>
              <button className="nav-pill active">Analytics</button>
              {isAdmin && (
                <button 
                  onClick={() => router.push('/admin')}
                  className="nav-pill"
                >
                  Admin
                </button>
              )}
            </nav>

            {/* Right Section */}
            <button
              onClick={() => router.push('/dashboard')}
              className="btn btn-ghost text-small"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 max-w-7xl mx-auto px-6 pb-12 animate-fadeIn">
        <h1 className="text-h1 mb-8" style={{ color: 'var(--text-primary)' }}>Analytics</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="metric-card">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245, 158, 11, 0.2)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <div>
                <div className="metric-value">{analytics.studyStreak}</div>
                <div className="metric-label">Day Streak</div>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-glow)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="metric-value">{analytics.totalStudyTime}h</div>
                <div className="metric-label">Total Study Time</div>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(59, 130, 246, 0.2)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--info)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <div className="metric-value">{analytics.topicsCompleted}</div>
                <div className="metric-label">Topics Completed</div>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-glow)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="metric-value">{Math.round(analytics.averageScore * 100)}%</div>
                <div className="metric-label">Avg Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="card p-6 mb-8">
          <h2 className="text-h2 mb-6" style={{ color: 'var(--text-primary)' }}>Weekly Progress</h2>
          {weeklyProgress.every(d => d.minutes === 0) ? (
            <div className="text-center py-12">
              <p className="text-body" style={{ color: 'var(--text-muted)' }}>
                No activity yet. Start studying to see your progress!
              </p>
            </div>
          ) : (
            <div className="flex items-end gap-4 h-48">
              {weeklyProgress.map((day, index) => {
                const maxMinutes = Math.max(...weeklyProgress.map(d => d.minutes), 1);
                const height = (day.minutes / maxMinutes) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${height}%`,
                        background: 'linear-gradient(to top, var(--accent), var(--accent-light))',
                        boxShadow: '0 0 12px var(--accent-glow)',
                        minHeight: '4px'
                      }}
                    />
                    <span className="text-caption" style={{ color: 'var(--text-muted)' }}>
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Topic Mastery */}
        {analytics.topicMastery.length > 0 && (
          <div className="card p-6">
            <h2 className="text-h2 mb-6" style={{ color: 'var(--text-primary)' }}>Topic Mastery</h2>
            <div className="space-y-4">
              {analytics.topicMastery.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-small" style={{ color: 'var(--text-secondary)' }}>{item.topic}</span>
                    <span className="text-small font-medium" style={{ color: 'var(--accent)' }}>{item.mastery}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${item.mastery}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
