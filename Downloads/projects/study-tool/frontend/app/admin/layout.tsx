'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/exams', label: 'Courses' },
  { href: '/admin/import', label: 'Import' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      // First check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin-login');
        return;
      }
      setUser(user);

      // Then verify admin privileges
      try {
        const res = await fetch('/api/admin/check');
        const data = await res.json();
        
        if (!data.isAdmin) {
          // Not an admin - redirect to admin login
          router.push('/admin-login');
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/admin-login');
        return;
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin-login');
    router.refresh();
  };

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <div className="spinner spinner-lg mb-4" />
          <p className="text-small" style={{ color: 'var(--text-muted)' }}>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Floating Header */}
      <header className="floating-header">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link 
                href="/admin" 
                className="text-h3 font-bold"
                style={{ color: 'var(--error)' }}
              >
                Admin
              </Link>
              <span className="badge badge-error text-caption">Restricted</span>
            </div>

            {/* Navigation Pills */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-pill ${isActive ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="btn btn-ghost text-small"
              >
                Exit Admin
              </Link>
              <span className="text-caption hidden md:block" style={{ color: 'var(--text-muted)' }}>
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="btn btn-ghost text-small"
                style={{ color: 'var(--error)' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-6 pb-12 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
