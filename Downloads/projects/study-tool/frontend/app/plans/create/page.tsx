'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface Course {
  id: string;
  name: string;
  description: string | null;
}

type WizardStep = 1 | 2 | 3 | 4;

export default function CreatePlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Wizard state
  const [step, setStep] = useState<WizardStep>(1);
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Form data
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [examDate, setExamDate] = useState('');
  const [minutesPerDay, setMinutesPerDay] = useState(60);
  const [preferredDays, setPreferredDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      const loadedCourses = await loadCourses();
      setLoading(false);

      // Check for auto-select course from URL
      const courseIdParam = searchParams.get('courseId');
      if (courseIdParam && loadedCourses.length > 0) {
        const found = loadedCourses.find((c: Course) => c.id === courseIdParam);
        if (found) {
            setSelectedCourse(found);
            setStep(2); // Auto-advance
        }
      }
    };
    init();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      const loaded = data.courses || [];
      setCourses(loaded);
      return loaded;
    } catch (error) {
      console.error('Failed to load courses:', error);
      return [];
    }
  };

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as WizardStep);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedCourse !== null;
      case 2: return examDate !== '';
      case 3: return minutesPerDay >= 15 && minutesPerDay <= 480;
      case 4: return true;
      default: return false;
    }
  };

  const handleCreatePlan = async () => {
    if (!selectedCourse || !examDate) return;
    
    setCreating(true);
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedCourse.id,
          examDate,
          minutesPerDay,
          preferredDays
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create plan');
      
      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message || 'Failed to create plan');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const stepTitles = [
    'Select Course',
    'Set Exam Date',
    'Daily Study Time',
    'Review & Create'
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Floating Header */}
      <header className="floating-header">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-h3 font-bold" style={{ color: 'var(--accent-light)' }}>Create Study Plan</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 max-w-4xl mx-auto py-8 px-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors"
                  style={{
                    background: s < step ? 'var(--success)' : s === step ? 'var(--accent-light)' : 'var(--bg-surface)',
                    color: s <= step ? 'var(--text-primary)' : 'var(--text-muted)'
                  }}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div 
                    className="flex-1 h-1 mx-2"
                    style={{ background: s < step ? 'var(--success)' : 'var(--bg-surface)' }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {stepTitles.map((title, i) => (
              <div 
                key={i} 
                className="text-caption"
                style={{ color: i + 1 === step ? 'var(--accent-light)' : 'var(--text-muted)' }}
              >
                {title}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="card p-8">
          {/* Step 1: Select Course */}
          {step === 1 && (
            <div>
              <h2 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>Select Your Course</h2>
              <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>Choose the course or exam you want to study for.</p>
              
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="mb-4" style={{ color: 'var(--text-muted)' }}>No courses available yet.</p>
                  <button
                    onClick={() => router.push('/plans/import')}
                    className="btn btn-ghost"
                    style={{ color: 'var(--accent-light)' }}
                  >
                    Import a course →
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className="text-left p-4 transition-all"
                      style={{
                        background: selectedCourse?.id === course.id ? 'rgba(0, 96, 122, 0.2)' : 'var(--bg-surface)',
                        border: `1px solid ${selectedCourse?.id === course.id ? 'var(--accent-light)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{course.name}</div>
                      {course.description && (
                        <div className="text-small mt-1" style={{ color: 'var(--text-muted)' }}>{course.description}</div>
                      )}
                    </button>
                  ))}
                  
                  {/* Always show import option even if courses exist */}
                  <button
                    onClick={() => router.push('/plans/import')}
                    className="w-full text-center p-3 mt-4 border-2 border-dashed border-[var(--border)] rounded-md hover:border-[var(--accent)] transition-colors"
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Don't see your course? </span>
                    <span style={{ color: 'var(--accent-light)' }} className="font-medium">Import a new one →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Set Exam Date */}
          {step === 2 && (
            <div>
              <h2 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>When is Your Exam?</h2>
              <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>We'll create a schedule working backwards from this date.</p>
              
              <div className="max-w-sm">
                <label className="block text-small font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input"
                />
                {examDate && (
                  <p className="mt-3" style={{ color: 'var(--text-muted)' }}>
                    {Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days until your exam
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Daily Study Time */}
          {step === 3 && (
            <div>
              <h2 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>How Much Time Can You Study?</h2>
              <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>Set your daily study commitment.</p>
              
              <div className="max-w-sm">
                <label className="block text-small font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Minutes per Day: <span style={{ color: 'var(--accent-light)' }} className="font-bold">{minutesPerDay}</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="240"
                  step="15"
                  value={minutesPerDay}
                  onChange={(e) => setMinutesPerDay(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: 'var(--bg-surface)', accentColor: 'var(--accent-light)' }}
                />
                <div className="flex justify-between text-caption mt-1" style={{ color: 'var(--text-muted)' }}>
                  <span>15 min</span>
                  <span>1 hr</span>
                  <span>2 hrs</span>
                  <span>4 hrs</span>
                </div>
                
                <div className="mt-6">
                  <label className="block text-small font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Preferred Study Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'mon', label: 'Mon' },
                      { key: 'tue', label: 'Tue' },
                      { key: 'wed', label: 'Wed' },
                      { key: 'thu', label: 'Thu' },
                      { key: 'fri', label: 'Fri' },
                      { key: 'sat', label: 'Sat' },
                      { key: 'sun', label: 'Sun' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => {
                          if (preferredDays.includes(key)) {
                            setPreferredDays(preferredDays.filter(d => d !== key));
                          } else {
                            setPreferredDays([...preferredDays, key]);
                          }
                        }}
                        className="px-4 py-2 font-medium transition-all"
                        style={{
                          background: preferredDays.includes(key) ? 'rgba(0, 96, 122, 0.2)' : 'var(--bg-surface)',
                          border: `1px solid ${preferredDays.includes(key) ? 'var(--accent-light)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-md)',
                          color: preferredDays.includes(key) ? 'var(--accent-light)' : 'var(--text-muted)'
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Create */}
          {step === 4 && (
            <div>
              <h2 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>Review Your Plan</h2>
              <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>Confirm your study plan settings.</p>
              
              <div className="space-y-4">
                <div 
                  className="flex justify-between items-center p-4"
                  style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Course</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedCourse?.name}</span>
                </div>
                <div 
                  className="flex justify-between items-center p-4"
                  style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Exam Date</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {new Date(examDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div 
                  className="flex justify-between items-center p-4"
                  style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Daily Study Time</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {minutesPerDay >= 60 
                      ? `${Math.floor(minutesPerDay / 60)}h ${minutesPerDay % 60}m`
                      : `${minutesPerDay} minutes`}
                  </span>
                </div>
                <div 
                  className="flex justify-between items-center p-4"
                  style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Study Days</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {preferredDays.length === 7 
                      ? 'Every day' 
                      : preferredDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="btn btn-secondary"
            style={{ opacity: step === 1 ? 0.5 : 1 }}
          >
            ← Back
          </button>
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn btn-primary"
              style={{ opacity: !canProceed() ? 0.5 : 1 }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleCreatePlan}
              disabled={creating}
              className="btn px-6 py-3"
              style={{ 
                background: 'var(--success)', 
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {creating ? (
                <>
                  <span className="spinner spinner-sm" />
                  Creating...
                </>
              ) : (
                'Create My Plan'
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
