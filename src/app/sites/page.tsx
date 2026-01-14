'use client';
import Logo from '../../components/Logo';
import SiteSelector from '../../components/SiteSelector';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Site {
  id: string;
  name: string;
  domain: string;
  description?: string;
  created_at: string;
}

interface SiteStats {
  visitors: number;
  events: number;
  pageViews: number;
  goals: number;
  funnels: number;
  cohorts: number;
  lastEvent: string | null;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTrackingCode, setShowTrackingCode] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [siteStats, setSiteStats] = useState<Record<string, SiteStats>>({});

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: ''
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      setSites(data);

      // Fetch stats for each site
      for (const site of data) {
        fetchSiteStats(site.id);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteStats = async (siteId: string) => {
    try {
      const response = await fetch(`/api/sites/${siteId}/stats`);
      const data = await response.json();
      setSiteStats(prev => ({ ...prev, [siteId]: data }));
    } catch (error) {
      console.error('Error fetching site stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingSite ? `/api/sites/${editingSite.id}` : '/api/sites';
      const method = editingSite ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({ name: '', domain: '', description: '' });
        setEditingSite(null);
        fetchSites();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save site');
      }
    } catch (error) {
      console.error('Error saving site:', error);
      alert('Failed to save site');
    }
  };

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      domain: site.domain,
      description: site.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site? All associated data will be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchSites();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete site');
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      alert('Failed to delete site');
    }
  };

  const openCreateModal = () => {
    setEditingSite(null);
    setFormData({ name: '', domain: '', description: '' });
    setShowModal(true);
  };

  const showTrackingCodeModal = (site: Site) => {
    setSelectedSite(site);
    setShowTrackingCode(true);
  };

  const copyTrackingCode = () => {
    if (!selectedSite) return;
    const code = getTrackingCode(selectedSite.id);
    navigator.clipboard.writeText(code);
    alert('Tracking code copied to clipboard!');
  };

  const getTrackingCode = (siteId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pulse-analytics-data-platform.vercel.app';
    return `<!-- Pulse Analytics - Advanced Tracking -->
<script src="${origin}/pixel.js"></script>
<script>
  window._bp = window._bp || [];
  window._bp.push(['init', '${siteId}']);
</script>
<!-- End Pulse Analytics -->`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading sites...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navigation Header */}
      <header style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#1e293b', fontWeight: 700 }}>Pulse Analytics</h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Sites Management</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/sites" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Sites</Link>
            <Link href="/settings/api-keys" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>Settings</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ padding: '32px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Sites</h1>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Manage your websites and tracking properties</p>
            </div>
            <button
              onClick={openCreateModal}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              + Add Site
            </button>
          </div>

          {/* Sites Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {sites.map((site) => {
              const stats = siteStats[site.id];
              return (
                <div
                  key={site.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '32px',
                    transition: 'transform 0.2s',
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        {site.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => showTrackingCodeModal(site)}
                          style={{
                            padding: '4px 12px',
                            background: '#10b98120',
                            color: '#10b981',
                            border: '1px solid #10b981',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Code
                        </button>
                        <button
                          onClick={() => handleEdit(site)}
                          style={{
                            padding: '4px 12px',
                            background: '#334155',
                            color: '#64748b',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(site.id)}
                          style={{
                            padding: '4px 12px',
                            background: '#ef444420',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 8px 0' }}>
                      🌐 {site.domain}
                    </p>
                    {site.description && (
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '8px 0 0 0' }}>
                        {site.description}
                      </p>
                    )}
                  </div>

                  {stats && (
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Visitors</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{stats.visitors.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Events</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{stats.events.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Page Views</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{stats.pageViews.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Goals</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{stats.goals.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {sites.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <p style={{ fontSize: '16px', marginBottom: '16px' }}>No sites yet</p>
              <p style={{ fontSize: '14px' }}>Create your first site to start tracking analytics</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
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
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '24px' }}>
              {editingSite ? 'Edit Site' : 'Create New Site'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                  Site Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="My Website"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    color: '#1e293b',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                  Domain *
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  required
                  placeholder="example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    color: '#1e293b',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    color: '#1e293b',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#334155',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#1e293b',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  {editingSite ? 'Save Changes' : 'Create Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tracking Code Modal */}
      {showTrackingCode && selectedSite && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowTrackingCode(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '700px',
              width: '90%',
              border: '1px solid #e2e8f0',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              Tracking Code for {selectedSite.name}
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
              Add this code to your website&apos;s &lt;head&gt; section to start tracking visitors.
            </p>
            <p style={{ color: '#10b981', fontSize: '13px', marginBottom: '24px', background: '#10b98110', padding: '12px', borderRadius: '6px', border: '1px solid #10b98140' }}>
              ✅ Includes: UTM tracking, scroll depth, form tracking, clicks, e-commerce events, and error tracking
            </p>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                  Site ID
                </label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedSite.id);
                    alert('Site ID copied!');
                  }}
                  style={{
                    padding: '4px 12px',
                    background: '#334155',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Copy ID
                </button>
              </div>
              <pre style={{
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '6px',
                color: '#2563eb',
                fontSize: '13px',
                overflow: 'auto',
                border: '1px solid #e2e8f0'
              }}>
                {selectedSite.id}
              </pre>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                  Tracking Code
                </label>
                <button
                  onClick={copyTrackingCode}
                  style={{
                    padding: '6px 16px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#1e293b',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  📋 Copy Code
                </button>
              </div>
              <pre style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '6px',
                color: '#1e293b',
                fontSize: '12px',
                overflow: 'auto',
                border: '1px solid #e2e8f0',
                maxHeight: '400px',
                lineHeight: '1.5'
              }}>
                {getTrackingCode(selectedSite.id)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTrackingCode(false)}
                style={{
                  padding: '10px 20px',
                  background: '#334155',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
