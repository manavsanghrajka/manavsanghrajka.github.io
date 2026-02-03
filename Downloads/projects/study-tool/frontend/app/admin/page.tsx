'use client';

import { useState, useEffect } from 'react';

interface Stats {
  courses: number;
  topics: number;
  flashcards: number;
  status: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fadeIn">
      <h1 className="text-h1 mb-8" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="metric-card">
          <div className="metric-value">
            {loading ? '...' : stats?.courses ?? 0}
          </div>
          <div className="metric-label">Total Courses</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {loading ? '...' : stats?.topics ?? 0}
          </div>
          <div className="metric-label">Topics</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {loading ? '...' : stats?.flashcards ?? 0}
          </div>
          <div className="metric-label">Flashcards</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: 'var(--accent)' }}>
            {loading ? '...' : 'Active'}
          </div>
          <div className="metric-label">System Status</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-h2 mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <a href="/admin/exams" className="btn btn-primary">
            Manage Courses
          </a>
          <a href="/admin/import" className="btn btn-secondary">
            Import Content
          </a>
          <a href="/analytics" className="btn btn-outline">
            View Analytics
          </a>
        </div>
      </div>
    </div>
  );
}
