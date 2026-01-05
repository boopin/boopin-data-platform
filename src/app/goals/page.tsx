'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Goal {
  id: string;
  name: string;
  description: string | null;
  type: 'event' | 'url';
  target_value: string;
  created_at: string;
  updated_at: string;
  stats?: {
    completions: number;
    completionsToday: number;
    completionsThisWeek: number;
    completionsThisMonth: number;
  };
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'event' as 'event' | 'url',
    target_value: ''
  });

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setGoals(result.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/goals';
      const method = editingGoal ? 'PUT' : 'POST';
      const body = editingGoal
        ? { ...formData, id: editingGoal.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to save goal');

      setShowModal(false);
      setEditingGoal(null);
      setFormData({ name: '', description: '', type: 'event', target_value: '' });
      fetchGoals();
    } catch (error) {
      console.error('Failed to save goal:', error);
      alert('Failed to save goal');
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || '',
      type: goal.type,
      target_value: goal.target_value
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const response = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      fetchGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
      alert('Failed to delete goal');
    }
  };

  const handleNewGoal = () => {
    setEditingGoal(null);
    setFormData({ name: '', description: '', type: 'event', target_value: '' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#e2e8f0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <p>Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.95)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 700 }}>Pulse Analytics</h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Goal Tracking</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/visitors" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Visitors</Link>
            <Link href="/segments" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Segments</Link>
            <Link href="/reports" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Reports</Link>
            <Link href="/live" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Live</Link>
            <Link href="/goals" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Goals</Link>
            <Link href="/funnels" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Funnels</Link>
            <Link href="/settings/api-keys" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>API Keys</Link>
            <Link href="/settings/webhooks" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Webhooks</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: 700 }}>🎯 Goals</h2>
            <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Track conversions and important events
            </p>
          </div>
          <button
            onClick={handleNewGoal}
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + New Goal
          </button>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '80px 20px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
            <p style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 600, margin: 0 }}>No goals yet</p>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '8px 0 24px' }}>
              Create your first goal to start tracking conversions
            </p>
            <button
              onClick={handleNewGoal}
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + Create Your First Goal
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {goals.map((goal) => (
              <div key={goal.id} style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
                {/* Goal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 600 }}>{goal.name}</h3>
                    {goal.description && (
                      <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>{goal.description}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(goal)}
                      style={{
                        background: '#334155',
                        color: '#e2e8f0',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Goal Type Badge */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{
                    background: goal.type === 'event' ? '#8b5cf6' : '#3b82f6',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {goal.type === 'event' ? '⚡ Event' : '🔗 URL'}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '8px' }}>
                    {goal.target_value}
                  </span>
                </div>

                {/* Stats */}
                <div style={{ background: '#0f172a', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>Total</p>
                      <p style={{ color: '#22d3ee', fontSize: '24px', fontWeight: 700, margin: '4px 0 0' }}>
                        {goal.stats?.completions || 0}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>Today</p>
                      <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 700, margin: '4px 0 0' }}>
                        {goal.stats?.completionsToday || 0}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>This Week</p>
                      <p style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 600, margin: '4px 0 0' }}>
                        {goal.stats?.completionsThisWeek || 0}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>This Month</p>
                      <p style={{ color: '#8b5cf6', fontSize: '18px', fontWeight: 600, margin: '4px 0 0' }}>
                        {goal.stats?.completionsThisMonth || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid #334155'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 24px', fontSize: '24px', color: '#f8fafc', fontWeight: 700 }}>
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
                  Goal Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                  placeholder="e.g., Newsletter Signup"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Optional description"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
                  Goal Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'event' | 'url' })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="event">Event Type</option>
                  <option value="url">URL/Page Path</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
                  Target Value *
                </label>
                <input
                  type="text"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                  placeholder={formData.type === 'event' ? 'e.g., form_submit' : 'e.g., /thank-you'}
                />
                <p style={{ color: '#64748b', fontSize: '12px', margin: '8px 0 0' }}>
                  {formData.type === 'event'
                    ? 'Enter the event type to track (e.g., purchase, sign_up)'
                    : 'Enter the page path to track (e.g., /thank-you, /checkout/complete)'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: '#334155',
                    color: '#e2e8f0',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
