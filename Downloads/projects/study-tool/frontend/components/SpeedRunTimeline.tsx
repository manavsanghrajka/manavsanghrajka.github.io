'use client';

import { useMemo } from 'react';

interface Task {
  id: string;
  topicName: string;
  type: 'learn' | 'review' | 'practice';
  dueDate: string;
  completed: boolean;
}

interface SpeedRunTimelineProps {
  examDate: string;
  examName: string;
  startDate: string;
  currentXP: number;
  levelXP: number; // XP needed for next level
  tasks: Task[];
  completedTasks: number;
  totalTasks: number;
}

export default function SpeedRunTimeline({
  examDate,
  examName,
  startDate,
  currentXP,
  levelXP,
  tasks,
  completedTasks,
  totalTasks
}: SpeedRunTimelineProps) {
  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (totalTasks === 0) return 0;
    return Math.min((completedTasks / totalTasks) * 100, 100);
  }, [completedTasks, totalTasks]);

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    const exam = new Date(examDate);
    const now = new Date();
    const diff = Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [examDate]);

  // Calculate total days
  const totalDays = useMemo(() => {
    const exam = new Date(examDate);
    const start = new Date(startDate);
    return Math.ceil((exam.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [examDate, startDate]);

  // Days elapsed
  const daysElapsed = totalDays - daysRemaining;
  const dayProgressPercent = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;

  return (
    <div 
      className="w-full p-4"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div 
            className="text-xs uppercase tracking-wide mb-1"
            style={{ color: 'var(--text-dim)' }}
          >
            [ SPEED RUN ]
          </div>
          <div 
            className="font-semibold uppercase"
            style={{ color: 'var(--text-primary)' }}
          >
            {examName}
          </div>
        </div>
        <div className="text-right">
          <div 
            className="text-2xl font-bold"
            style={{ color: daysRemaining <= 7 ? 'var(--error)' : 'var(--text-primary)' }}
          >
            {daysRemaining}
          </div>
          <div 
            className="text-xs uppercase"
            style={{ color: 'var(--text-dim)' }}
          >
            DAYS LEFT
          </div>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="relative mb-4">
        {/* Track Background */}
        <div 
          className="h-8 relative overflow-hidden"
          style={{ 
            border: '1px solid var(--border)',
            background: 'var(--bg-base)'
          }}
        >
          {/* Progress Fill */}
          <div 
            className="absolute top-0 left-0 h-full"
            style={{ 
              width: `${progressPercent}%`,
              background: 'var(--text-primary)',
              transition: 'width 0.3s ease'
            }}
          />
          
          {/* Runner Avatar */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-sm"
            style={{ 
              left: `${progressPercent}%`,
              transform: `translateX(-50%) translateY(-50%)`,
              width: '24px',
              height: '24px',
              background: 'var(--active-bg)',
              color: 'var(--active-text)',
              fontWeight: 'bold',
              zIndex: 10
            }}
          >
            ▶
          </div>

          {/* Finish Flag */}
          <div 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-lg"
            title="Exam Day!"
          >
            🏁
          </div>
        </div>

        {/* Milestones */}
        <div className="flex justify-between mt-1">
          <span 
            className="text-xs"
            style={{ color: 'var(--text-dim)' }}
          >
            START
          </span>
          <span 
            className="text-xs"
            style={{ color: 'var(--text-dim)' }}
          >
            {progressPercent.toFixed(0)}% COMPLETE
          </span>
          <span 
            className="text-xs"
            style={{ color: 'var(--text-dim)' }}
          >
            EXAM
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div 
        className="grid grid-cols-3 gap-4 pt-4"
        style={{ borderTop: '1px dotted var(--border)' }}
      >
        <div className="text-center">
          <div 
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {completedTasks}
          </div>
          <div 
            className="text-xs uppercase"
            style={{ color: 'var(--text-dim)' }}
          >
            COMPLETED
          </div>
        </div>
        <div className="text-center">
          <div 
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {totalTasks - completedTasks}
          </div>
          <div 
            className="text-xs uppercase"
            style={{ color: 'var(--text-dim)' }}
          >
            REMAINING
          </div>
        </div>
        <div className="text-center">
          <div 
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {currentXP}
          </div>
          <div 
            className="text-xs uppercase"
            style={{ color: 'var(--text-dim)' }}
          >
            TOTAL XP
          </div>
        </div>
      </div>
    </div>
  );
}
