'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export default function StudentImportPage() {
  /* State */
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string; courseId?: string } | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  const handleImport = async () => {
    if (!file) return;

    try {
      setImporting(true);
      setStatus(null); // Clear previous status
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isPrivate', 'true'); // Student imports create private courses

      // Reusing the existing robust import API
      // Private courses are only visible to this user
      const res = await fetch('/api/admin/import-course', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Import failed');

      setStatus({ 
        type: 'success', 
        message: `Success! Created study material for "${data.course.name}"`,
        courseId: data.course.id
      });
      
      setFile(null);

      // Auto-redirect to Plan Creation Wizard with course pre-selected
      // This fulfills: "enter details -> generate this study plan"
      setTimeout(() => {
          router.push(`/plans/create?courseId=${data.course.id}`);
      }, 1500);
      
    } catch (e: any) {
      console.error(e);
      setStatus({ type: 'error', message: e.message });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ background: 'var(--bg-base)' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
           <h1 className="text-h3 font-bold" style={{ color: 'var(--text-primary)' }}>Import Study Material</h1>
           <button onClick={() => router.back()} className="btn btn-ghost">Close</button>
        </div>
      </header>
      
      <main className="pt-24 max-w-2xl mx-auto px-6 pb-12">
      <div className="card p-8">
        <div className="mb-8 text-center">
           <div className="mb-6 inline-flex p-4 rounded-full bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border)]">
             <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
             </svg>
           </div>
           
           <h2 className="text-h2 mb-3" style={{ color: 'var(--text-primary)' }}>
             Upload Your Syllabus or Notes
           </h2>
           <p className="text-body max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
             Upload a PDF, document, or text file. Our AI will analyze it to convert it into a structured study plan just for you.
           </p>
        </div>

        <div className="mb-8 p-8 border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-colors text-center">
           <input 
             type="file" 
             id="file-upload"
             onChange={(e) => setFile(e.target.files?.[0] || null)}
             className="hidden"
           />
           <label 
             htmlFor="file-upload"
             className="cursor-pointer block w-full h-full"
           >
                {file ? (
                    <div className="flex flex-col items-center">
                        <span className="text-h3 mb-2 font-medium" style={{ color: 'var(--accent-light)' }}>{file.name}</span>
                        <span className="text-small" style={{ color: 'var(--text-muted)' }}>Click to change file</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="btn btn-secondary mb-3 pointer-events-none">Choose File</span>
                        <span className="text-caption" style={{ color: 'var(--text-muted)' }}>PDF, DOCX, TXT up to 10MB</span>
                    </div>
                )}
           </label>
        </div>

        {status && (
          <div 
            className={`p-4 mb-6 text-center animate-fadeIn rounded-lg border`}
            style={{ 
              background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: status.type === 'success' ? 'var(--success)' : 'var(--error)',
              color: status.type === 'success' ? 'var(--success)' : 'var(--error)'
            }}
          >
            <p className="font-medium">{status.message}</p>
            {status.type === 'success' && <p className="text-sm mt-1 opacity-80">Redirecting to plan setup...</p>}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleImport}
            disabled={importing || !file}
            className="btn btn-primary w-full py-4 text-body font-bold"
          >
            {importing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner spinner-sm" />
                Processing with Gemini 2.5...
              </span>
            ) : (
              'Import & Create Plan'
            )}
          </button>
          
          <button
            onClick={() => router.back()}
            disabled={importing}
            className="btn btn-ghost w-full"
          >
            Cancel
          </button>
        </div>
      </div>
      </main>
    </div>
  );
}
