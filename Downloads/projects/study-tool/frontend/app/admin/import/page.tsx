'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export default function ImportCoursePage() {
  /* State */
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  
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

      const res = await fetch('/api/admin/import-course', {
        method: 'POST',
        // Headers are automatically set for FormData
        body: formData
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Import failed');

      setStatus({ 
        type: 'success', 
        message: `Imported: ${data.course.name} (${data.topicCount || data.topicsCreated} topics)`,
        courseId: data.course.id
      });
      
      setFile(null);

      // Auto-redirect if returnTo is present
      if (returnTo) {
        setTimeout(() => {
          router.push(`${returnTo}?courseId=${data.course.id}`);
        }, 1500);
      }
      
    } catch (e: any) {
      console.error(e);
      setStatus({ type: 'error', message: e.message });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-h1 mb-8" style={{ color: 'var(--text-primary)' }}>Import Course</h1>
      
      <div className="card p-6">
        <div className="mb-6 animate-fadeIn py-8 text-center border-2 border-dashed border-[var(--border)] rounded-md">
           <div className="mb-4 text-[var(--accent)]">
             <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
           </div>
           <p className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>
             Upload Course Material
           </p>
           <p className="text-body mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
             Upload any file (PDF, Doc, Text, etc). Our AI will analyze it and automatically structure your course modules and topics.
           </p>
           <input 
             type="file" 
             onChange={(e) => setFile(e.target.files?.[0] || null)}
             className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent-light)] file:text-[var(--text-primary)] hover:file:bg-[var(--accent)]"
           />
           {file && (
             <div className="mt-4 p-3 bg-[var(--bg-surface)] inline-block rounded border border-[var(--border)]">
               Selected: <span className="font-semibold">{file.name}</span>
             </div>
           )}
        </div>

        {status && (
          <div 
            className={`p-4 mb-4 text-small animate-fadeIn ${status.type === 'success' ? 'badge-success' : 'badge-error'}`}
            style={{ 
              background: status.type === 'success' 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
              borderRadius: 'var(--radius-md)',
              color: status.type === 'success' ? 'var(--success)' : 'var(--error)'
            }}
          >
            <div className="flex justify-between items-center">
                <span>{status.message}</span>
                {status.type === 'success' && status.courseId && !returnTo && (
                    <button 
                        onClick={() => router.push(`/plans/create?courseId=${status.courseId}`)}
                        className="btn btn-sm btn-primary ml-4"
                    >
                        Create Plan →
                    </button>
                )}
                {status.type === 'success' && returnTo && (
                    <span className="text-sm italic ml-2">Redirecting...</span>
                )}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleImport}
            disabled={importing || !file}
            className="btn btn-primary"
          >
            {importing ? (
              <>
                <span className="spinner spinner-sm" />
                Analyzing Document...
              </>
            ) : (
              'Analyze & Import'
            )}
          </button>
          <button
            onClick={() => returnTo ? router.push(returnTo) : router.push('/admin')}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
