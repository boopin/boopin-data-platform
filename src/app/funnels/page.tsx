'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';
import Navigation from '../../components/Navigation';

interface FunnelStep {
  name: string;
  type: 'event' | 'url';
  value: string;
}

interface Funnel {
  id: string;
  name: string;
  description: string;
  steps: FunnelStep[];
  created_at: string;
  updated_at: string;
}

export default function FunnelsPage() {
  const { selectedSite, loading: siteLoading } = useSite();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFunnel, setNewFunnel] = useState({
    name: '',
    description: '',
    steps: [
      { name: '', type: 'event' as 'event' | 'url', value: '' },
      { name: '', type: 'event' as 'event' | 'url', value: '' }
    ]
  });

  useEffect(() => {
    fetchFunnels();
  }, [selectedSite]);

  const fetchFunnels = async () => {
    if (!selectedSite) return;

    try {
      const response = await fetch(`/api/funnels?site_id=${selectedSite.id}`);
      const data = await response.json();
      setFunnels(data.funnels || []);
    } catch (error) {
      console.error('Error fetching funnels:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFunnel = async () => {
    if (!selectedSite) return;

    try {
      // Validate
      if (!newFunnel.name.trim()) {
        alert('Please enter a funnel name');
        return;
      }

      const validSteps = newFunnel.steps.filter(s => s.name && s.value);
      if (validSteps.length < 2) {
        alert('Please add at least 2 valid steps');
        return;
      }

      const response = await fetch('/api/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFunnel.name,
          description: newFunnel.description,
          steps: validSteps,
          site_id: selectedSite.id
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewFunnel({
          name: '',
          description: '',
          steps: [
            { name: '', type: 'event', value: '' },
            { name: '', type: 'event', value: '' }
          ]
        });
        fetchFunnels();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create funnel');
      }
    } catch (error) {
      console.error('Error creating funnel:', error);
      alert('Failed to create funnel');
    }
  };

  const deleteFunnel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this funnel?')) return;
    if (!selectedSite) return;

    try {
      await fetch(`/api/funnels?id=${id}&site_id=${selectedSite.id}`, { method: 'DELETE' });
      fetchFunnels();
    } catch (error) {
      console.error('Error deleting funnel:', error);
    }
  };

  const addStep = () => {
    setNewFunnel({
      ...newFunnel,
      steps: [...newFunnel.steps, { name: '', type: 'event', value: '' }]
    });
  };

  const removeStep = (index: number) => {
    if (newFunnel.steps.length <= 2) {
      alert('A funnel must have at least 2 steps');
      return;
    }
    setNewFunnel({
      ...newFunnel,
      steps: newFunnel.steps.filter((_, i) => i !== index)
    });
  };

  const updateStep = (index: number, field: keyof FunnelStep, value: string) => {
    const updatedSteps = [...newFunnel.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setNewFunnel({ ...newFunnel, steps: updatedSteps });
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
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Funnel Analysis</p>
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
              📊 Funnel Analysis
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Create and analyze multi-step conversion funnels
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
          + Create Funnel
        </button>
      </div>

      {/* Funnels List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>Loading funnels...</div>
      ) : funnels.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f7fafc',
          borderRadius: '12px',
          border: '2px dashed #cbd5e0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2d3748', marginBottom: '8px' }}>
            No funnels yet
          </h3>
          <p style={{ color: '#718096', marginBottom: '24px' }}>
            Create your first funnel to start analyzing conversion rates
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
            Create Your First Funnel
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {funnels.map((funnel) => (
            <div
              key={funnel.id}
              style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1a202c', marginBottom: '8px' }}>
                  {funnel.name}
                </h3>
                {funnel.description && (
                  <p style={{ fontSize: '14px', color: '#718096', marginBottom: '12px' }}>
                    {funnel.description}
                  </p>
                )}
                <div style={{ fontSize: '12px', color: '#a0aec0' }}>
                  {funnel.steps.length} steps • Created {new Date(funnel.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Steps Preview */}
              <div style={{ marginBottom: '20px', padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
                {funnel.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: idx < funnel.steps.length - 1 ? '8px' : '0' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#2d3748', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {step.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#718096', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {step.type === 'event' ? '🎯 Event: ' : '🔗 URL: '}{step.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  href={`/funnels/${funnel.id}`}
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
                  View Analysis
                </Link>
                <button
                  onClick={() => deleteFunnel(funnel.id)}
                  style={{
                    background: '#fff',
                    color: '#e53e3e',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: '1px solid #fc8181',
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

      {/* Create Funnel Modal */}
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
            background: '#fff',
            padding: '32px',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1a202c', marginBottom: '24px' }}>
              Create New Funnel
            </h2>

            {/* Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#2d3748', marginBottom: '8px' }}>
                Funnel Name *
              </label>
              <input
                type="text"
                value={newFunnel.name}
                onChange={(e) => setNewFunnel({ ...newFunnel, name: e.target.value })}
                placeholder="e.g., Purchase Funnel"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#2d3748', marginBottom: '8px' }}>
                Description (optional)
              </label>
              <textarea
                value={newFunnel.description}
                onChange={(e) => setNewFunnel({ ...newFunnel, description: e.target.value })}
                placeholder="Describe this funnel..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Steps */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#2d3748', marginBottom: '12px' }}>
                Funnel Steps (minimum 2) *
              </label>

              {newFunnel.steps.map((step, index) => (
                <div key={index} style={{
                  marginBottom: '16px',
                  padding: '16px',
                  background: '#f7fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2d3748' }}>
                      Step {index + 1}
                    </div>
                    {newFunnel.steps.length > 2 && (
                      <button
                        onClick={() => removeStep(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e53e3e',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => updateStep(index, 'name', e.target.value)}
                    placeholder="Step name (e.g., Homepage)"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #cbd5e0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      marginBottom: '8px'
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                    <select
                      value={step.type}
                      onChange={(e) => updateStep(index, 'type', e.target.value)}
                      style={{
                        padding: '8px 10px',
                        border: '1px solid #cbd5e0',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    >
                      <option value="event">Event</option>
                      <option value="url">URL Pattern</option>
                    </select>

                    <input
                      type="text"
                      value={step.value}
                      onChange={(e) => updateStep(index, 'value', e.target.value)}
                      placeholder={step.type === 'event' ? 'e.g., page_view' : 'e.g., /checkout%'}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #cbd5e0',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addStep}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#f7fafc',
                  border: '1px dashed #cbd5e0',
                  borderRadius: '6px',
                  color: '#667eea',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Add Step
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#fff',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  color: '#2d3748',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={createFunnel}
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
                Create Funnel
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
