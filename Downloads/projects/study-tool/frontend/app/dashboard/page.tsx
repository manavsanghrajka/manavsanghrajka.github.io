'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import DopamineBar from '@/components/DopamineBar';
import ListenButton from '@/components/ListenButton';
import SpeedRunTimeline from '@/components/SpeedRunTimeline';
import DailyFocusCard from '@/components/DailyFocusCard';

interface StudyTask {
  id?: string;
  topicId: string;
  topicName: string;
  type: 'learn' | 'review' | 'practice';
  priority: number;
  durationMinutes: number;
  dueDate: string;
  reason: string;
}

interface ScheduleStats {
  totalTopics: number;
  masteredTopics: number;
  dueTopics: number;
  averageMastery: number;
}

interface Plan {
  id: string;
  examName: string;
  examDate: string;
  minutesPerDay: number;
  createdAt?: string;
}

// Skeleton component
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// Stats skeleton
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="metric-card">
          <Skeleton className="h-10 w-20 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// Tasks skeleton
function TasksSkeleton() {
  return (
    <div className="card p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 card-solid">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [gamification, setGamification] = useState<{ xp: number; level: number } | null>(null);
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
      await Promise.all([
        loadSchedule(),
        loadGamification(user.id),
        checkAdminStatus()
      ]);
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

  const loadSchedule = async () => {
    try {
      const res = await fetch('/api/schedule/today');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setStats(data.stats || null);
        setPlan(data.plan || null);
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  };

  const loadGamification = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_gamification')
        .select('xp, level')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setGamification(data);
      } else {
        // Default if not found
        setGamification({ xp: 0, level: 1 });
      }
    } catch (error) {
      console.error('Failed to load gamification:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const startStudy = (task: StudyTask) => {
    const params = new URLSearchParams({
      name: task.topicName,
      course: plan?.examName || 'Course'
    });
    router.push(`/ai-study/${task.topicId}?${params.toString()}`);
  };

  // Calculate days until exam
  const daysUntilExam = plan 
    ? Math.ceil((new Date(plan.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;
    
  // Calculate XP for next level: 1000 * 1.5^(level-1)
  const nextLevelXP = gamification 
    ? Math.floor(1000 * Math.pow(1.5, gamification.level - 1))
    : 1000;



  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Floating Header */}
      <header className="floating-header">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <h1 className="text-h3 font-bold" style={{ color: 'var(--text-primary)' }}>HYPERLAPSE v2.0</h1>

            {/* Navigation Pills */}
            <nav className="flex items-center gap-1">
              <button className="nav-pill active">DASHBOARD</button>
              <button 
                onClick={() => router.push('/analytics')}
                className="nav-pill"
              >
                ANALYTICS
              </button>
              {isAdmin && (
                <button 
                  onClick={() => router.push('/admin')}
                  className="nav-pill"
                >
                  ADMIN
                </button>
              )}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <span className="text-caption hidden md:block" style={{ color: 'var(--text-muted)' }}>
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="btn btn-ghost text-small"
                style={{ color: 'var(--error)' }}
              >
                [ EXIT ]
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dopamine Bar - XP/Level/Streak */}
      <div className="fixed top-16 left-0 right-0 z-40">
        <DopamineBar />
      </div>

      <main className="pt-36 max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="animate-fadeIn">
            <div className="mb-8 flex items-center justify-between">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
            <StatsSkeleton />
            <TasksSkeleton />
          </div>
        ) : !plan ? (
           <div className="text-center py-24 animate-fadeIn">
            <h1 className="text-h1 mb-4" style={{ color: 'var(--text-primary)' }}>WELCOME TO HYPERLAPSE</h1>
            <p className="text-body mb-8 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
              Ready to start your knowledge run? Create a study plan to generate your personalized speed run timeline.
            </p>
            <button
              onClick={() => router.push('/plans/create')}
              className="btn btn-primary"
            >
              [ INITIALIZE NEW RUN ]
            </button>
          </div>
        ) : (
          <div className="animate-fadeIn space-y-8">
            {/* Speed Run Timeline */}
            <SpeedRunTimeline 
              examDate={plan.examDate}
              examName={plan.examName}
              startDate={plan.createdAt || new Date().toISOString()} // Fallback if not available
              currentXP={gamification?.xp || 0}
              levelXP={nextLevelXP}
              tasks={tasks.map(t => ({ 
                id: t.topicId, 
                topicName: t.topicName, 
                type: t.type, 
                dueDate: t.dueDate, 
                completed: false 
              }))}
              completedTasks={stats?.masteredTopics || 0}
              totalTasks={stats?.totalTopics || 0}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Daily Focus Card (Left 2/3) */}
              <div className="md:col-span-2">
                <DailyFocusCard 
                  tasks={tasks.map(t => ({
                    ...t,
                    id: t.topicId // Ensure id is mapped from topicId
                  }))}
                  onStartTask={(task) => startStudy({
                    ...task,
                    topicId: task.topicId || task.id, // Handle potential mapping
                    // Ensure required properties for StudyTask
                    topicName: task.topicName,
                    type: task.type,
                    priority: task.priority || 1,
                    durationMinutes: task.durationMinutes || 15,
                    dueDate: new Date().toISOString(), // Mock if missing
                    reason: task.reason || 'Study task'
                  })}

                />
              </div>

              {/* Stats/Quick Actions (Right 1/3) */}
              <div className="space-y-6">
                <div className="card p-4">
                  <h3 className="text-h3 mb-4">[ QUICK ACTIONS ]</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => router.push('/plans/create')}
                      className="btn btn-outline w-full justify-between"
                    >
                      <span>EDIT PLAN</span>
                      <span>→</span>
                    </button>
                    <button 
                      onClick={() => router.push('/analytics')}
                      className="btn btn-outline w-full justify-between"
                    >
                      <span>VIEW STATS</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {stats && (
                  <div className="card p-4">
                    <h3 className="text-h3 mb-4">[ MASTERY ]</h3>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {Math.round(stats.averageMastery * 100)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${stats.averageMastery * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
