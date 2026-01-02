'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: {
    track_events?: boolean;
    read_data?: boolean;
    manage_goals?: boolean;
    manage_segments?: boolean;
  };
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    expires_in_days: '',
    permissions: {
      track_events: true,
      read_data: false,
      manage_goals: false,
      manage_segments: false
    }
  });

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/api-keys');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setApiKeys(result.keys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create API key');

      const result = await response.json();
      setNewKey(result.key); // Show the key ONCE
      setFormData({
        name: '',
        expires_in_days: '',
        permissions: {
          track_events: true,
          read_data: false,
          manage_goals: false,
          manage_segments: false
        }
      });
      fetchApiKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      fetchApiKeys();
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !isActive })
      });

      if (!response.ok) throw new Error('Failed to update');
      fetchApiKeys();
    } catch (error) {
      console.error('Failed to toggle API key:', error);
      alert('Failed to update API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#e2e8f0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
          <p>Loading API keys...</p>
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
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>API Keys</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/visitors" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Visitors</Link>
            <Link href="/segments" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Segments</Link>
            <Link href="/reports" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Reports</Link>
            <Link href="/live" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Live</Link>
            <Link href="/goals" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Goals</Link>
            <Link href="/funnels" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Funnels</Link>
            <Link href="/settings/api-keys" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>API Keys</Link>
            <Link href="/settings/webhooks" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Webhooks</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: 700 }}>🔑 API Keys</h2>
            <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Manage API keys for server-side tracking
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
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
            + Create API Key
          </button>
        </div>

        {/* API Keys Table */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>NAME</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>KEY</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>PERMISSIONS</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>LAST USED</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    No API keys yet. Create one to get started with server-side tracking.
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: '14px 16px', color: '#f8fafc', fontSize: '14px', fontWeight: 500 }}>
                      {key.name}
                      {key.expires_at && (
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                          Expires: {formatDate(key.expires_at)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <code style={{ background: '#0f172a', color: '#22d3ee', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                        {key.key_prefix}...
                      </code>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {key.permissions.track_events && (
                          <span style={{ background: '#10b98120', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                            TRACK
                          </span>
                        )}
                        {key.permissions.read_data && (
                          <span style={{ background: '#3b82f620', color: '#3b82f6', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                            READ
                          </span>
                        )}
                        {key.permissions.manage_goals && (
                          <span style={{ background: '#f59e0b20', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                            GOALS
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>
                      {formatDate(key.last_used_at)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleToggleActive(key.id, key.is_active)}
                        style={{
                          background: key.is_active ? '#10b98120' : '#64748b20',
                          color: key.is_active ? '#10b981' : '#64748b',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {key.is_active ? '● ACTIVE' : '○ INACTIVE'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(key.id)}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Documentation */}
        <div style={{ marginTop: '32px', background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#f8fafc', fontWeight: 600 }}>📖 How to Use Server-Side Tracking</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
            Track events from your backend server using the Server-Side Events API:
          </p>
          <pre style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '12px', color: '#22d3ee', border: '1px solid #334155' }}>
{`curl -X POST https://pulse-analytics-data-platform.vercel.app/api/track/server \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_type": "purchase",
    "visitor_id": "user123",
    "properties": {
      "order_id": "ORD-001",
      "total": 99.99,
      "currency": "USD"
    }
  }'`}
          </pre>
        </div>
      </main>

      {/* Create Modal */}
      {showModal && (
        <div
          style={{
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
          onClick={() => {
            setShowModal(false);
            setNewKey(null);
          }}
        >
          <div
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              border: '1px solid #334155',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {newKey ? (
              <>
                <h3 style={{ margin: '0 0 24px', fontSize: '24px', color: '#f8fafc', fontWeight: 700 }}>
                  ✅ API Key Created!
                </h3>
                <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                  <p style={{ color: '#92400e', fontWeight: 600, margin: '0 0 8px' }}>⚠️ Save this key now!</p>
                  <p style={{ color: '#a16207', fontSize: '13px', margin: 0 }}>
                    This is the only time you'll see the full API key. Store it securely.
                  </p>
                </div>
                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                  <code style={{ color: '#22d3ee', fontSize: '14px', wordBreak: 'break-all' }}>
                    {newKey}
                  </code>
                </div>
                <button
                  onClick={() => copyToClipboard(newKey)}
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  📋 Copy to Clipboard
                </button>
              </>
            ) : (
              <>
                <h3 style={{ margin: '0 0 24px', fontSize: '24px', color: '#f8fafc', fontWeight: 700 }}>
                  Create New API Key
                </h3>

                <form onSubmit={handleCreate}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
                      Key Name *
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
                      placeholder="e.g., Production Server"
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
                      Expires In (days)
                    </label>
                    <input
                      type="number"
                      value={formData.expires_in_days}
                      onChange={(e) => setFormData({ ...formData, expires_in_days: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        background: '#0f172a',
                        color: '#e2e8f0',
                        fontSize: '14px'
                      }}
                      placeholder="Leave empty for no expiration"
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '12px', fontWeight: 500 }}>
                      Permissions
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { key: 'track_events', label: 'Track Events', desc: 'Send events from server' },
                        { key: 'read_data', label: 'Read Data', desc: 'Query analytics data' },
                        { key: 'manage_goals', label: 'Manage Goals', desc: 'Create/update goals' },
                        { key: 'manage_segments', label: 'Manage Segments', desc: 'Create/update segments' }
                      ].map((perm) => (
                        <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#0f172a', borderRadius: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.permissions[perm.key as keyof typeof formData.permissions]}
                            onChange={(e) => setFormData({
                              ...formData,
                              permissions: {
                                ...formData.permissions,
                                [perm.key]: e.target.checked
                              }
                            })}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ color: '#f8fafc', fontSize: '14px', fontWeight: 500 }}>{perm.label}</div>
                            <div style={{ color: '#64748b', fontSize: '12px' }}>{perm.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
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
                      Create API Key
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
