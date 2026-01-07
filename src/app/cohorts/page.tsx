'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';
import Navigation from '../../components/Navigation';

interface Cohort {
  id: string;
  name: string;
  description: string;
  cohort_type: string;
  date_field: string;
  interval_type: string;
  retention_periods: number[];
  created_at: string;
  updated_at: string;
}

export default function CohortsPage() {
  const { selectedSite, loading: siteLoading } = useSite();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCohort, setNewCohort] = useState({
    name: '',
    description: '',
    cohort_type: 'visitor',
    date_field: 'first_seen',
    interval_type: 'weekly',
    retention_periods: [1, 7, 14, 30, 60, 90]
  });

  useEffect(() => {
    fetchCohorts();
  }, [selectedSite]);

  const fetchCohorts = async () => {
    if (!selectedSite) return;

    try {
      const response = await fetch(`/api/cohorts?site_id=${selectedSite.id}`);
      const data = await response.json();
      setCohorts(data.cohorts || []);
    } catch (error) {
      console.error('Error fetching cohorts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCohort = async () => {
    if (!selectedSite) return;

    try {
      if (!newCohort.name.trim()) {
        alert('Please enter a cohort name');
        return;
      }

      const response = await fetch('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCohort,
          site_id: selectedSite.id
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewCohort({
          name: '',
          description: '',
          cohort_type: 'visitor',
          date_field: 'first_seen',
          interval_type: 'weekly',
          retention_periods: [1, 7, 14, 30, 60, 90]
        });
        fetchCohorts();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create cohort');
      }
    } catch (error) {
      console.error('Error creating cohort:', error);
      alert('Failed to create cohort');
    }
  };

  const deleteCohort = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cohort?')) return;
    if (!selectedSite) return;

    try {
      await fetch(`/api/cohorts?id=${id}&site_id=${selectedSite.id}`, { method: 'DELETE' });
      fetchCohorts();
    } catch (error) {
      console.error('Error deleting cohort:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navigation Header */}
      <header style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.95)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 700 }}>Pulse Analytics</h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Cohort Analysis</p>
              </div>
            </Link>
          </div>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <div style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                📈 Cohort Analysis
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Track user retention and behavior patterns over time
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              + Create Cohort
            </button>
          </div>

          {/* Cohorts List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading cohorts...</div>
          ) : cohorts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#1e293b',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                No cohorts yet
              </h3>
              <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                Create your first cohort to start tracking user retention
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Create Your First Cohort
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
              {cohorts.map((cohort) => (
                <div
                  key={cohort.id}
                  style={{
                    background: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    padding: '24px'
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                      {cohort.name}
                    </h3>
                    {cohort.description && (
                      <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
                        {cohort.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        background: '#667eea20',
                        color: '#a78bfa',
                        borderRadius: '4px',
                        fontWeight: 500
                      }}>
                        {cohort.interval_type}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        background: '#06b6d420',
                        color: '#22d3ee',
                        borderRadius: '4px',
                        fontWeight: 500
                      }}>
                        {cohort.retention_periods.length} periods
                      </span>
                    </div>
                  </div>

                  {/* Retention Periods */}
                  <div style={{ marginBottom: '20px', padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>
                      Tracking Periods (days)
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {cohort.retention_periods.map((period, idx) => (
                        <span key={idx} style={{
                          fontSize: '13px',
                          padding: '4px 10px',
                          background: '#1e293b',
                          color: '#e2e8f0',
                          borderRadius: '4px',
                          border: '1px solid #334155'
                        }}>
                          {period}d
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      href={`/cohorts/${cohort.id}`}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        padding: '10px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      View Retention
                    </Link>
                    <button
                      onClick={() => deleteCohort(cohort.id)}
                      style={{
                        background: '#1e293b',
                        color: '#ef4444',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: '1px solid #991b1b',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Cohort Modal */}
          {showCreateModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}>
              <div style={{
                background: '#1e293b',
                padding: '32px',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '1px solid #334155'
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>
                  Create New Cohort
                </h2>

                {/* Name */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
                    Cohort Name *
                  </label>
                  <input
                    type="text"
                    value={newCohort.name}
                    onChange={(e) => setNewCohort({ ...newCohort, name: e.target.value })}
                    placeholder="e.g., Weekly User Cohorts"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={newCohort.description}
                    onChange={(e) => setNewCohort({ ...newCohort, description: e.target.value })}
                    placeholder="Describe this cohort..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Interval Type */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
                    Cohort Interval *
                  </label>
                  <select
                    value={newCohort.interval_type}
                    onChange={(e) => setNewCohort({ ...newCohort, interval_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  >
                    <option value="daily">Daily Cohorts</option>
                    <option value="weekly">Weekly Cohorts</option>
                    <option value="monthly">Monthly Cohorts</option>
                  </select>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    Group users by when they first visited
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createCohort}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Create Cohort
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
