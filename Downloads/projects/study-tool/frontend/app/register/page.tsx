'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import VibeSelector, { type VibePesona } from '@/components/VibeSelector';

export default function RegisterPage() {
  // Step management
  const [step, setStep] = useState<1 | 2>(1);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<VibePesona>('professional');
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // Save vibe to database after registration
  const saveVibe = async (userId: string) => {
    try {
      await fetch('/api/user/vibe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vibe_persona: selectedVibe })
      });
    } catch (error) {
      console.error('Failed to save vibe:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      // Save vibe preference
      if (data.user) {
        await saveVibe(data.user.id);
      }
      
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
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
          redirectTo: `${window.location.origin}/auth/callback?vibe=${selectedVibe}`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || `Failed to sign in with ${provider}`);
      setOauthLoading(null);
    }
  };

  const proceedToStep2 = () => {
    setError('');
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setStep(2);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg-base)' }}
    >
      <div 
        className="w-full max-w-md p-6"
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <Link 
            href="/"
            style={{ 
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '16px',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            HYPERLAPSE
          </Link>
          <div 
            className="mt-2"
            style={{ 
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {step === 1 ? '[ STEP 1/2: ACCOUNT ]' : '[ STEP 2/2: VIBE CHECK ]'}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          <div 
            className="flex-1 h-1"
            style={{ background: 'var(--text-primary)' }}
          />
          <div 
            className="flex-1 h-1"
            style={{ background: step === 2 ? 'var(--text-primary)' : 'var(--border)' }}
          />
        </div>

        {step === 1 ? (
          <>
            {/* Step 1: Account Creation */}
            <form onSubmit={(e) => { e.preventDefault(); proceedToStep2(); }} className="space-y-4">
              <div>
                <label 
                  className="block mb-2"
                  style={{ 
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}
                >
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label 
                  className="block mb-2"
                  style={{ 
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}
                >
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label 
                  className="block mb-2"
                  style={{ 
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}
                >
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div 
                  className="p-3"
                  style={{ 
                    border: '1px solid var(--error)',
                    color: 'var(--error)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px'
                  }}
                >
                  [ ERROR ] {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full"
              >
                CONTINUE TO VIBE CHECK →
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div style={{ borderTop: '1px dotted var(--border)', flex: 1 }} />
              <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>OR</span>
              <div style={{ borderTop: '1px dotted var(--border)', flex: 1 }} />
            </div>

            {/* OAuth buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleOAuthLogin('google')}
                disabled={!!oauthLoading}
                className="btn btn-outline w-full"
              >
                {oauthLoading === 'google' ? 'CONNECTING...' : '[ GOOGLE ]'}
              </button>
              <button
                onClick={() => handleOAuthLogin('github')}
                disabled={!!oauthLoading}
                className="btn btn-outline w-full"
              >
                {oauthLoading === 'github' ? 'CONNECTING...' : '[ GITHUB ]'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Vibe Selection */}
            <form onSubmit={handleRegister} className="space-y-6">
              <VibeSelector 
                value={selectedVibe}
                onChange={setSelectedVibe}
                disabled={loading}
              />

              {error && (
                <div 
                  className="p-3"
                  style={{ 
                    border: '1px solid var(--error)',
                    color: 'var(--error)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px'
                  }}
                >
                  [ ERROR ] {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-outline flex-1"
                  disabled={loading}
                >
                  ← BACK
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Sign in link */}
        <div className="mt-6 text-center">
          <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
            ALREADY HAVE AN ACCOUNT?{' '}
          </span>
          <Link
            href="/login"
            style={{ 
              color: 'var(--text-primary)', 
              fontSize: '12px',
              textDecoration: 'underline'
            }}
          >
            SIGN IN
          </Link>
        </div>
      </div>
    </div>
  );
}
