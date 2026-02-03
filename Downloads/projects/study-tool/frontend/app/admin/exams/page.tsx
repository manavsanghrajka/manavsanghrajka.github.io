'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

interface Exam {
  id: string;
  name: string;
  description: string | null;
}

export default function ExamsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await loadExams();
      }
    };
    init();
  }, []);

  const loadExams = async () => {
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      setExams(data.courses || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingExam 
        ? `/api/courses/${editingExam.id}`
        : '/api/courses';
      
      await fetch(url, {
        method: editingExam ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setFormData({ name: '', description: '' });
      setShowForm(false);
      setEditingExam(null);
      loadExams();
    } catch (error: any) {
      alert(error.message || 'Failed to save course');
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({ name: exam.name, description: exam.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/admin/exams?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }
      loadExams();
    } catch (error: any) {
      alert(error.message || 'Failed to delete course');
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>Courses</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingExam(null);
            setFormData({ name: '', description: '' });
          }}
          className="btn btn-primary"
        >
          + Add Course
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-8 animate-slideUp">
          <h2 className="text-h2 mb-6" style={{ color: 'var(--text-primary)' }}>
            {editingExam ? 'Edit Course' : 'New Course'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-small font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Course Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., AP Biology"
              />
            </div>
            <div>
              <label className="block text-small font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
                placeholder="Brief description"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">
                {editingExam ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingExam(null);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {exams.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-body mb-4" style={{ color: 'var(--text-muted)' }}>
            No courses yet. Create your first course to get started.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            Create Course
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam, index) => (
            <div 
              key={exam.id} 
              className="card p-6 flex items-center justify-between animate-slideUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div>
                <h3 className="text-h3" style={{ color: 'var(--text-primary)' }}>{exam.name}</h3>
                {exam.description && (
                  <p className="text-small mt-1" style={{ color: 'var(--text-muted)' }}>
                    {exam.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(exam)}
                  className="btn btn-ghost text-small"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(exam.id)}
                  className="btn btn-ghost text-small"
                  style={{ color: 'var(--error)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
