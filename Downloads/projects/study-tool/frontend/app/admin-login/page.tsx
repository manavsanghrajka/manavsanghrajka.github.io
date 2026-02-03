'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const verifyAdminAndRedirect = async () => {
    // Check if user is an admin
    const res = await fetch('/api/admin/check');
    const data = await res.json();

    if (!data.isAdmin) {
      // Sign out if not admin
      await supabase.auth.signOut();
      throw new Error('Access denied. Admin privileges required.');
    }

    router.push('/admin');
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First, authenticate with Supabase
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      await verifyAdminAndRedirect();
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // Redirect to admin callback which will verify admin status
          redirectTo: `${window.location.origin}/auth/admin-callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || `Failed to sign in with ${provider}`);
      setOauthLoading(null);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Subtle gradient overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.08) 0%, transparent 50%)'
        }}
      />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 
              className="text-display font-bold"
              style={{ color: 'var(--error)' }}
            >
              Admin Portal
            </h1>
          </Link>
          <p className="text-body mt-2" style={{ color: 'var(--text-muted)' }}>
            Restricted access - Administrators only
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-8" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={oauthLoading !== null}
              className="btn btn-secondary w-full"
              style={{ justifyContent: 'center' }}
            >
              {oauthLoading === 'google' ? (
                <>
                  <span className="spinner spinner-sm" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Admin Login with Google
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={oauthLoading !== null}
              className="btn btn-secondary w-full"
              style={{ justifyContent: 'center' }}
            >
              {oauthLoading === 'github' ? (
                <>
                  <span className="spinner spinner-sm" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Admin Login with GitHub
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
            </div>
            <div className="relative flex justify-center">
              <span 
                className="px-4 text-small"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                or use email
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div 
                className="p-4 text-small animate-fadeIn"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--error)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--error)'
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label 
                htmlFor="email"
                className="block text-small font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label 
                htmlFor="password"
                className="block text-small font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn w-full"
              style={{
                background: 'var(--error)',
                color: 'var(--text-primary)'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" />
                  Verifying...
                </>
              ) : (
                'Admin Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-small" style={{ color: 'var(--text-muted)' }}>
              Not an admin?{' '}
              <Link 
                href="/login"
                className="font-medium hover:underline"
                style={{ color: 'var(--accent-light)' }}
              >
                Go to regular login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
