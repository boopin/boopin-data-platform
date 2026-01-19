'use client';
import Logo from '../../components/Logo';
import SiteSelector from '../../components/SiteSelector';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';
import Navigation from '../../components/Navigation';

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
  const { selectedSite, loading: siteLoading } = useSite();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'event' as 'event' | 'url',
    target_value: ''
  });

  const fetchGoals = async () => {
    if (!selectedSite) return;

    try {
      const response = await fetch(`/api/goals?site_id=${selectedSite.id}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setGoals(result.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    if (!selectedSite) return;

    try {
      const response = await fetch(`/api/events/types?site_id=${selectedSite.id}`);
      const types = await response.json();
      setEventTypes(types || []);
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  };

  useEffect(() => {
    fetchGoals();
    fetchEventTypes();
  }, [selectedSite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;

    try {
      const url = '/api/goals';
      const method = editingGoal ? 'PUT' : 'POST';
      const body = editingGoal
        ? { ...formData, id: editingGoal.id, site_id: selectedSite.id }
        : { ...formData, site_id: selectedSite.id };

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
    if (!selectedSite) return;

    try {
      const response = await fetch(`/api/goals?id=${id}&site_id=${selectedSite.id}`, { method: 'DELETE' });
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

  const exportToCSV = () => {
    const headers = ['Name', 'Type', 'Target Value', 'Description', 'Total Completions', 'Today', 'This Week', 'This Month', 'Created'];
    const rows = goals.map(g => [
      g.name,
      g.type,
      g.target_value,
      g.description || '',
      g.stats?.completions || 0,
      g.stats?.completionsToday || 0,
      g.stats?.completionsThisWeek || 0,
      g.stats?.completionsThisMonth || 0,
      new Date(g.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(goals, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goals-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (siteLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#1e293b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <p>Loading goals...</p>
        </div>
      </div>
    );
  }

  if (!selectedSite) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#1e293b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <p>No site selected. Please select a site from the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Navigation />
            <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }} />
            <SiteSelector />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: 700 }}>🎯 Goals</h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
              Track conversions and important events
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={exportToCSV}
              style={{
                background: '#10b981',
                color: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📊 CSV
            </button>
            <button
              onClick={exportToJSON}
              style={{
                background: '#6366f1',
                color: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📦 JSON
            </button>
            <button
              onClick={handleNewGoal}
              style={{
                background: '#2563eb',
                color: '#1e293b',
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
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '80px 20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
            <p style={{ color: '#1e293b', fontSize: '18px', fontWeight: 600, margin: 0 }}>No goals yet</p>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '8px 0 24px' }}>
              Create your first goal to start tracking conversions
            </p>
            <button
              onClick={handleNewGoal}
              style={{
                background: '#2563eb',
                color: '#1e293b',
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
              <div key={goal.id} style={{ background: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e2e8f0' }}>
                {/* Goal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: 600 }}>{goal.name}</h3>
                    {goal.description && (
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>{goal.description}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(goal)}
                      style={{
                        background: '#334155',
                        color: '#1e293b',
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
                        color: '#1e293b',
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
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>Total</p>
                      <p style={{ color: '#2563eb', fontSize: '24px', fontWeight: 700, margin: '4px 0 0' }}>
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
              background: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid #e2e8f0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 24px', fontSize: '24px', color: '#1e293b', fontWeight: 700 }}>
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#64748b', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
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
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#1e293b',
                    fontSize: '14px'
                  }}
                  placeholder="e.g., Newsletter Signup"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#64748b', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#1e293b',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Optional description"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#64748b', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
                  Goal Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'event' | 'url' })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#1e293b',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="event">Event Type</option>
                  <option value="url">URL/Page Path</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#64748b', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
                  Target Value *
                </label>
                {formData.type === 'event' ? (
                  <>
                    <input
                      type="text"
                      list="goal-event-types"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#1e293b',
                        fontSize: '14px'
                      }}
                      placeholder="Select or type event name"
                    />
                    <datalist id="goal-event-types">
                      {eventTypes.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </>
                ) : (
                  <input
                    type="text"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#1e293b',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., /thank-you"
                  />
                )}
                <p style={{ color: '#64748b', fontSize: '12px', margin: '8px 0 0' }}>
                  {formData.type === 'event'
                    ? 'Select from tracked events or enter a custom event type (e.g., purchase, sign_up)'
                    : 'Enter the page path to track (e.g., /thank-you, /checkout/complete)'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: '#334155',
                    color: '#1e293b',
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
                    background: '#2563eb',
                    color: '#1e293b',
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
