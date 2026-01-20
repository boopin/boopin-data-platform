'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSite } from '../../../contexts/SiteContext';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';

interface Segment {
  id: string;
  name: string;
  description: string;
  rules: Array<{ type: string; operator: string; value: string }>;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  first_seen_at: string;
  last_seen_at: string;
  visit_count: number;
}

interface Webhook {
  id: string;
  webhook_url: string;
  webhook_type: string;
  is_active: boolean;
  last_triggered: string | null;
}

export default function SegmentDetailPage() {
  const params = useParams();
  const { selectedSite, loading: siteLoading } = useSite();
  const [segment, setSegment] = useState<Segment | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'export' | 'webhooks' | 'ads'>('users');

  // Webhook form state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookType, setWebhookType] = useState('generic');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [triggeringWebhook, setTriggeringWebhook] = useState<string | null>(null);
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!selectedSite) return;

      try {
        const [segmentRes, webhooksRes] = await Promise.all([
          fetch(`/api/segments/${params.id}?site_id=${selectedSite.id}`),
          fetch(`/api/segments/${params.id}/webhook?site_id=${selectedSite.id}`)
        ]);

        const segmentData = await segmentRes.json();
        setSegment(segmentData.segment);
        setUsers(segmentData.users || []);

        const webhooksData = await webhooksRes.json();
        setWebhooks(webhooksData.webhooks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id && selectedSite) {
      fetchData();
    }
  }, [params.id, selectedSite]);

  const handleExport = (format: 'csv' | 'json' | 'google_ads' | 'meta_ads') => {
    if (!selectedSite) return;
    window.open(`/api/segments/${params.id}/export?format=${format}&site_id=${selectedSite.id}`, '_blank');
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl || !selectedSite) return;

    setSavingWebhook(true);
    try {
      const res = await fetch(`/api/segments/${params.id}/webhook?site_id=${selectedSite.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: webhookUrl, webhook_type: webhookType, is_active: true })
      });

      if (res.ok) {
        const data = await res.json();
        setWebhooks([...webhooks.filter(w => w.webhook_type !== webhookType), data.webhook]);
        setWebhookUrl('');
        setWebhookResult({ success: true, message: 'Webhook saved successfully!' });
      }
    } catch (err) {
      setWebhookResult({ success: false, message: 'Failed to save webhook' });
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleTriggerWebhook = async (type: string) => {
    if (!selectedSite) return;

    setTriggeringWebhook(type);
    setWebhookResult(null);

    try {
      const res = await fetch(`/api/segments/${params.id}/webhook/trigger?site_id=${selectedSite.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_type: type })
      });

      const data = await res.json();
      if (data.success) {
        setWebhookResult({ success: true, message: `✓ Sent ${data.users_sent} users to ${type} webhook` });
      } else {
        setWebhookResult({ success: false, message: data.error || 'Webhook trigger failed' });
      }
    } catch (err) {
      setWebhookResult({ success: false, message: 'Failed to trigger webhook' });
    } finally {
      setTriggeringWebhook(null);
    }
  };

  const handleDeleteWebhook = async (type: string) => {
    if (!confirm('Delete this webhook?') || !selectedSite) return;

    try {
      await fetch(`/api/segments/${params.id}/webhook?type=${type}&site_id=${selectedSite.id}`, { method: 'DELETE' });
      setWebhooks(webhooks.filter(w => w.webhook_type !== type));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const ruleLabels: Record<string, string> = {
    page_views: 'Page Views',
    total_events: 'Total Events',
    visited_page: 'Visited Page',
    country: 'Country',
    city: 'City',
    device: 'Device Type',
    utm_source: 'UTM Source',
    event_type: 'Event Type',
    is_identified: 'Is Identified',
    has_email: 'Has Email',
    has_phone: 'Has Phone',
    last_seen_days: 'Last Seen (Days)'
  };

  const operatorLabels: Record<string, string> = {
    greater_than: '>',
    less_than: '<',
    equals: '=',
    greater_or_equal: '≥',
    less_or_equal: '≤',
    contains: 'contains',
    not_contains: 'not contains',
    not_equals: '≠'
  };

  const webhookTypes = [
    { value: 'generic', label: 'Generic Webhook', icon: '🔗', desc: 'Send data to any URL (Zapier, Make, n8n, custom)' },
    { value: 'slack', label: 'Slack', icon: '💬', desc: 'Send notifications to Slack channel' },
    { value: 'meta_ads', label: 'Meta Ads', icon: '📘', desc: 'Push to Meta Custom Audiences' },
    { value: 'google_ads', label: 'Google Ads', icon: '🔍', desc: 'Push to Google Customer Match' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading segment...</p>
      </div>
    );
  }

  if (!segment) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', fontSize: '18px' }}>Segment not found</p>
          <a href="/segments" style={{ color: '#22d3ee', marginTop: '16px', display: 'inline-block' }}>← Back to Segments</a>
        </div>
      </div>
    );
  }

  const inputStyle = { background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', fontSize: '14px', width: '100%' };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };
  const buttonStyle = { background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', fontWeight: 600 };
  const buttonSecondaryStyle = { background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.95)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 700 }}>Pulse Analytics</h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Segment Details</p>
              </div>
            </a>
          </div>
          <Navigation />
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Breadcrumb */}
        <a href="/segments" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
          ← Back to Segments
        </a>

        {/* Segment Header */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: 700 }}>🎯 {segment.name}</h2>
              <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>{segment.description || 'No description'}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ background: '#8b5cf620', color: '#a78bfa', padding: '8px 16px', borderRadius: '8px', fontSize: '16px', fontWeight: 700 }}>
                {users.length} users
              </span>
            </div>
          </div>

          {/* Rules Display */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {segment.rules.map((rule, i) => (
              <span key={i} style={{ background: '#0f172a', color: '#94a3b8', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#22d3ee' }}>{ruleLabels[rule.type] || rule.type}</span>
                <span style={{ color: '#64748b' }}>{operatorLabels[rule.operator] || rule.operator}</span>
                <span style={{ color: '#f59e0b' }}>{rule.value}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#1e293b', borderRadius: '8px', padding: '4px' }}>
          {[
            { id: 'users', label: '👥 Users', count: users.length },
            { id: 'export', label: '📥 Export' },
            { id: 'webhooks', label: '🔗 Webhooks' },
            { id: 'ads', label: '📢 Ad Platforms' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeTab === tab.id ? '#334155' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: activeTab === tab.id ? '#fff' : '#94a3b8',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span style={{ background: '#0f172a', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>Matching Users</h3>
                <span style={{ color: '#64748b', fontSize: '13px' }}>{users.filter(u => u.email).length} with email</span>
              </div>
              {users.length === 0 ? (
                <p style={{ padding: '48px', textAlign: 'center', color: '#64748b', margin: 0 }}>No users match this segment</p>
              ) : (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#0f172a' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Email</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Name</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Phone</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Visits</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Last Seen</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} style={{ borderTop: '1px solid #334155' }}>
                          <td style={{ padding: '12px 16px', color: '#22d3ee', fontSize: '13px' }}>{user.email || '-'}</td>
                          <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: '13px' }}>{user.name || '-'}</td>
                          <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>{user.phone || '-'}</td>
                          <td style={{ padding: '12px 16px', color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>{user.visit_count}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>{formatDate(user.last_seen_at)}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <a href={`/visitors/${user.id}`} style={{ color: '#06b6d4', fontSize: '12px', textDecoration: 'none' }}>View Profile →</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: '#fff' }}>📥 Export Segment Data</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* CSV Export */}
                <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
                  <h4 style={{ margin: '0 0 8px', color: '#fff', fontSize: '16px' }}>CSV Export</h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
                    Download user data as CSV file. Compatible with Excel, Google Sheets, and most tools.
                  </p>
                  <button onClick={() => handleExport('csv')} style={buttonStyle}>
                    ⬇️ Download CSV
                  </button>
                </div>

                {/* JSON Export */}
                <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                  <h4 style={{ margin: '0 0 8px', color: '#fff', fontSize: '16px' }}>JSON Export</h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
                    Download as JSON for developers. Includes full metadata and timestamps.
                  </p>
                  <button onClick={() => handleExport('json')} style={buttonSecondaryStyle}>
                    ⬇️ Download JSON
                  </button>
                </div>

                {/* Meta Ads Format */}
                <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📘</div>
                  <h4 style={{ margin: '0 0 8px', color: '#fff', fontSize: '16px' }}>Meta Custom Audiences</h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
                    CSV with hashed emails for Meta Ads Manager. Upload directly to create Custom Audience.
                  </p>
                  <button onClick={() => handleExport('meta_ads')} style={{ ...buttonSecondaryStyle, background: '#1877f2' }}>
                    ⬇️ Download for Meta
                  </button>
                </div>

                {/* Google Ads Format */}
                <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                  <h4 style={{ margin: '0 0 8px', color: '#fff', fontSize: '16px' }}>Google Customer Match</h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
                    CSV with hashed data for Google Ads. Upload to create Customer Match audience.
                  </p>
                  <button onClick={() => handleExport('google_ads')} style={{ ...buttonSecondaryStyle, background: '#4285f4' }}>
                    ⬇️ Download for Google
                  </button>
                </div>
              </div>

              {/* Export Info */}
              <div style={{ marginTop: '24px', padding: '20px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#fff', fontSize: '14px' }}>🔒 Privacy & Security</h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
                    Ad platform exports use <strong style={{ color: '#22d3ee' }}>SHA-256 hashing</strong> to protect user data.
                    Emails, phone numbers, and names are hashed before export so your users' PII is never exposed.
                    The ad platforms can still match users by comparing hashes.
                  </p>
                </div>

                {/* Export Stats */}
                <div style={{ display: 'flex', gap: '32px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                  <div>
                    <p style={{ color: '#64748b', fontSize: '11px', margin: 0, textTransform: 'uppercase' }}>Total Users</p>
                    <p style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>{users.length}</p>
                  </div>
                  <div>
                    <p style={{ color: '#64748b', fontSize: '11px', margin: 0, textTransform: 'uppercase' }}>With Email</p>
                    <p style={{ color: '#22d3ee', fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>{users.filter(u => u.email).length}</p>
                  </div>
                  <div>
                    <p style={{ color: '#64748b', fontSize: '11px', margin: 0, textTransform: 'uppercase' }}>With Phone</p>
                    <p style={{ color: '#10b981', fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>{users.filter(u => u.phone).length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: '#fff' }}>🔗 Webhook Integrations</h3>
              
              {/* Result Message */}
              {webhookResult && (
                <div style={{ 
                  padding: '12px 16px', 
                  marginBottom: '20px', 
                  borderRadius: '8px', 
                  background: webhookResult.success ? '#10b98120' : '#ef444420',
                  color: webhookResult.success ? '#10b981' : '#ef4444',
                  fontSize: '14px'
                }}>
                  {webhookResult.message}
                </div>
              )}

              {/* Existing Webhooks */}
              {webhooks.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 12px', textTransform: 'uppercase' }}>Active Webhooks</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {webhooks.map((webhook) => {
                      const typeInfo = webhookTypes.find(t => t.value === webhook.webhook_type) || webhookTypes[0];
                      return (
                        <div key={webhook.id} style={{ background: '#0f172a', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{typeInfo.icon}</span>
                            <div>
                              <p style={{ color: '#fff', margin: 0, fontSize: '14px', fontWeight: 500 }}>{typeInfo.label}</p>
                              <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '12px', fontFamily: 'monospace' }}>{webhook.webhook_url.slice(0, 50)}...</p>
                              {webhook.last_triggered && (
                                <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '11px' }}>Last triggered: {formatDate(webhook.last_triggered)}</p>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleTriggerWebhook(webhook.webhook_type)}
                              disabled={triggeringWebhook === webhook.webhook_type}
                              style={{ ...buttonStyle, padding: '8px 16px', fontSize: '12px', opacity: triggeringWebhook === webhook.webhook_type ? 0.5 : 1 }}
                            >
                              {triggeringWebhook === webhook.webhook_type ? '⏳ Sending...' : '▶️ Trigger'}
                            </button>
                            <button 
                              onClick={() => handleDeleteWebhook(webhook.webhook_type)}
                              style={{ background: '#ef444420', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add New Webhook */}
              <div style={{ background: '#0f172a', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
                <h4 style={{ color: '#fff', fontSize: '15px', margin: '0 0 16px' }}>➕ Add New Webhook</h4>
                
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Webhook Type</label>
                    <select value={webhookType} onChange={(e) => setWebhookType(e.target.value)} style={selectStyle}>
                      {webhookTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                      ))}
                    </select>
                    <p style={{ color: '#64748b', fontSize: '11px', margin: '4px 0 0' }}>
                      {webhookTypes.find(t => t.value === webhookType)?.desc}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Webhook URL</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.zapier.com/... or https://hooks.slack.com/..."
                      style={inputStyle}
                    />
                  </div>
                  
                  <button 
                    onClick={handleSaveWebhook} 
                    disabled={savingWebhook || !webhookUrl}
                    style={{ ...buttonStyle, opacity: savingWebhook || !webhookUrl ? 0.5 : 1 }}
                  >
                    {savingWebhook ? '⏳ Saving...' : '💾 Save Webhook'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ads Tab */}
          {activeTab === 'ads' && (
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: '#fff' }}>📢 Push to Ad Platforms</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* Meta Ads */}
                <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: '#1877f2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📘</div>
                    <div>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Meta Custom Audiences</h4>
                      <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '12px' }}>Facebook & Instagram Ads</p>
                    </div>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
                    Create a Custom Audience in Meta Ads Manager to retarget these users on Facebook and Instagram.
                  </p>
                  <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>Users with email: <span style={{ color: '#22d3ee', fontWeight: 600 }}>{users.filter(u => u.email).length}</span></p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleExport('csv')} style={{ ...buttonStyle, background: '#1877f2', flex: 1 }}>
                      📥 Download CSV
                    </button>
                    <a href="https://business.facebook.com/adsmanager/audiences" target="_blank" rel="noopener noreferrer" style={{ ...buttonSecondaryStyle, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ↗️
                    </a>
                  </div>
                </div>

                {/* Google Ads */}
                <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: '#4285f4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🔍</div>
                    <div>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Google Customer Match</h4>
                      <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '12px' }}>Google Search, Display & YouTube</p>
                    </div>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
                    Upload to Google Ads to target users across Search, Display, Gmail, and YouTube.
                  </p>
                  <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>Users with email: <span style={{ color: '#22d3ee', fontWeight: 600 }}>{users.filter(u => u.email).length}</span></p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleExport('csv')} style={{ ...buttonStyle, background: '#4285f4', flex: 1 }}>
                      📥 Download CSV
                    </button>
                    <a href="https://ads.google.com/aw/audiences/management" target="_blank" rel="noopener noreferrer" style={{ ...buttonSecondaryStyle, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ↗️
                    </a>
                  </div>
                </div>

                {/* LinkedIn */}
                <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: '#0077b5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>💼</div>
                    <div>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>LinkedIn Matched Audiences</h4>
                      <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '12px' }}>B2B targeting</p>
                    </div>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
                    Upload email list to LinkedIn Campaign Manager for B2B retargeting campaigns.
                  </p>
                  <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>Users with email: <span style={{ color: '#22d3ee', fontWeight: 600 }}>{users.filter(u => u.email).length}</span></p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleExport('csv')} style={{ ...buttonStyle, background: '#0077b5', flex: 1 }}>
                      📥 Download CSV
                    </button>
                    <a href="https://www.linkedin.com/campaignmanager" target="_blank" rel="noopener noreferrer" style={{ ...buttonSecondaryStyle, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ↗️
                    </a>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div style={{ marginTop: '24px', background: '#0f172a', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
                <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '15px' }}>📖 How to Upload</h4>
                <ol style={{ color: '#94a3b8', fontSize: '13px', margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
                  <li>Click "Download CSV" for your chosen platform</li>
                  <li>Go to the ad platform's Audience Manager</li>
                  <li>Create a new "Customer List" or "Custom Audience"</li>
                  <li>Upload the CSV file</li>
                  <li>Wait for matching (usually 24-48 hours)</li>
                  <li>Use the audience in your campaigns!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
