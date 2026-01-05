'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Webhook {
  id: string;
  name: string;
  url: string;
  event_types: string[] | null;
  secret: string;
  is_active: boolean;
  created_at: string;
  last_triggered_at: string | null;
  total_triggers: number;
  last_status: number | null;
  last_error: string | null;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    event_types: [] as string[],
  });

  const availableEventTypes = [
    'page_view',
    'click',
    'form_submit',
    'form_start',
    'form_abandon',
    'identify',
    'signup',
    'login',
    'logout',
    'product_view',
    'add_to_cart',
    'remove_from_cart',
    'view_cart',
    'begin_checkout',
    'add_payment_info',
    'add_shipping_info',
    'purchase',
    'video_start',
    'video_progress',
    'video_complete',
    'file_download',
    'search',
    'share',
    'custom_event',
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/webhooks');
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          event_types: formData.event_types.length > 0 ? formData.event_types : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedSecret(data.secret);
        setFormData({ name: '', url: '', event_types: [] });
        fetchWebhooks();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
      alert('Failed to create webhook');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ Copied to clipboard!');
  };

  const closeSecretModal = () => {
    setCreatedSecret(null);
    setShowCreateModal(false);
  };

  const handleUpdate = async () => {
    if (!editingWebhook) return;

    try {
      const res = await fetch('/api/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingWebhook.id,
          name: formData.name,
          url: formData.url,
          event_types: formData.event_types.length > 0 ? formData.event_types : null,
        }),
      });

      if (res.ok) {
        alert('✅ Webhook updated successfully!');
        setEditingWebhook(null);
        setFormData({ name: '', url: '', event_types: [] });
        fetchWebhooks();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to update webhook:', error);
      alert('Failed to update webhook');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const res = await fetch(`/api/webhooks?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('✅ Webhook deleted');
        fetchWebhooks();
      } else {
        alert('Failed to delete webhook');
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      alert('Failed to delete webhook');
    }
  };

  const handleToggleActive = async (webhook: Webhook) => {
    try {
      const res = await fetch('/api/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: webhook.id,
          is_active: !webhook.is_active,
        }),
      });

      if (res.ok) {
        fetchWebhooks();
      } else {
        alert('Failed to toggle webhook status');
      }
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
      alert('Failed to toggle webhook');
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Webhook test successful!\n\nStatus: ${data.status} ${data.statusText}`);
        fetchWebhooks();
      } else {
        alert(`❌ Webhook test failed:\n\n${data.error}`);
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert('Failed to test webhook');
    } finally {
      setTestingId(null);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '', url: '', event_types: [] });
    setShowCreateModal(true);
  };

  const openEditModal = (webhook: Webhook) => {
    setFormData({
      name: webhook.name,
      url: webhook.url,
      event_types: webhook.event_types || [],
    });
    setEditingWebhook(webhook);
  };

  const toggleEventType = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      event_types: prev.event_types.includes(eventType)
        ? prev.event_types.filter(e => e !== eventType)
        : [...prev.event_types, eventType],
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading webhooks...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', background: '#f9fafb' }}>
      {/* Navigation */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 30px',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/" style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)',
            transition: 'background 0.2s'
          }}>
            📊 Dashboard
          </Link>
          <Link href="/visitors" style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)'
          }}>
            👥 Visitors
          </Link>
          <Link href="/segments" style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)'
          }}>
            🎯 Segments
          </Link>
          <Link href="/live" style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)'
          }}>
            🔴 Live
          </Link>
          <Link href="/goals" style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)'
          }}>
            🎯 Goals
          </Link>
          <Link href="/funnels" style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)'
          }}>
            📊 Funnels
          </Link>
          <Link href="/reports" style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)'
          }}>
            📈 Reports
          </Link>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
            <Link href="/settings/api-keys" style={{
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.1)'
            }}>
              🔑 API Keys
            </Link>
            <Link href="/settings/webhooks" style={{
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.2)'
            }}>
              🪝 Webhooks
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: '#1a202c' }}>
            🪝 Webhooks
          </h1>
          <p style={{ color: '#666', fontSize: '15px' }}>
            Send real-time event data to external URLs
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
          }}
        >
          + Create Webhook
        </button>
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <div style={{
          background: '#f7fafc',
          padding: '60px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '2px dashed #cbd5e0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🪝</div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#2d3748' }}>
            No webhooks yet
          </h3>
          <p style={{ color: '#718096', marginBottom: '24px' }}>
            Create your first webhook to start receiving real-time event notifications
          </p>
          <button
            onClick={openCreateModal}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600
            }}
          >
            Create Webhook
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {webhooks.map(webhook => (
            <div
              key={webhook.id}
              style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1a202c', margin: 0, wordBreak: 'break-word' }}>
                      {webhook.name}
                    </h3>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: webhook.is_active ? '#d4edda' : '#f8d7da',
                      color: webhook.is_active ? '#155724' : '#721c24'
                    }}>
                      {webhook.is_active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                  <div style={{ color: '#4a5568', fontSize: '14px', marginBottom: '12px', wordBreak: 'break-all' }}>
                    <strong>URL:</strong> {webhook.url}
                  </div>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: '#718096' }}>
                    <div>
                      <strong>Event Types:</strong>{' '}
                      {webhook.event_types ? webhook.event_types.join(', ') : 'All events'}
                    </div>
                    <div>
                      <strong>Total Triggers:</strong> {webhook.total_triggers}
                    </div>
                    {webhook.last_triggered_at && (
                      <div>
                        <strong>Last Triggered:</strong>{' '}
                        {new Date(webhook.last_triggered_at).toLocaleString()}
                      </div>
                    )}
                    {webhook.last_status && (
                      <div>
                        <strong>Last Status:</strong>{' '}
                        <span style={{
                          color: webhook.last_status >= 200 && webhook.last_status < 300 ? '#38a169' : '#e53e3e',
                          fontWeight: 600
                        }}>
                          {webhook.last_status}
                        </span>
                      </div>
                    )}
                  </div>
                  {webhook.last_error && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#fff5f5',
                      borderLeft: '4px solid #fc8181',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: '#c53030'
                    }}>
                      <strong>Last Error:</strong> {webhook.last_error}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleTest(webhook.id)}
                    disabled={testingId === webhook.id}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      background: '#fff',
                      cursor: testingId === webhook.id ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#4a5568',
                      opacity: testingId === webhook.id ? 0.6 : 1
                    }}
                  >
                    {testingId === webhook.id ? '⏳ Testing...' : '🧪 Test'}
                  </button>
                  <button
                    onClick={() => handleToggleActive(webhook)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#4a5568'
                    }}
                  >
                    {webhook.is_active ? '⏸️ Disable' : '▶️ Enable'}
                  </button>
                  <button
                    onClick={() => openEditModal(webhook)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#4a5568'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #fc8181',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#e53e3e'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documentation */}
      <div style={{
        marginTop: '40px',
        background: '#f7fafc',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#1a202c' }}>
          📚 Webhook Documentation
        </h2>
        <div style={{ color: '#4a5568', lineHeight: '1.6', fontSize: '14px' }}>
          <p style={{ marginBottom: '16px' }}>
            Webhooks allow you to receive real-time notifications when events occur in Pulse Analytics.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#2d3748' }}>
            Webhook Payload Example:
          </h3>
          <pre style={{
            background: '#1a202c',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
{`{
  "webhook_id": "uuid-here",
  "event_type": "pageview",
  "data": {
    "event_id": "event-uuid",
    "visitor_id": "visitor-uuid",
    "properties": {...},
    "timestamp": "2026-01-02T10:30:00.000Z"
  },
  "timestamp": "2026-01-02T10:30:00.000Z"
}`}
          </pre>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#2d3748' }}>
            Security:
          </h3>
          <p style={{ marginBottom: '8px' }}>
            Each webhook includes an <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>X-Pulse-Analytics-Signature</code> header containing your webhook secret. Use this to verify requests are coming from Pulse Analytics.
          </p>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingWebhook) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1a202c' }}>
              {editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#2d3748' }}>
                Webhook Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Production Webhook"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#2d3748' }}>
                Webhook URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://your-domain.com/webhook"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#2d3748' }}>
                Event Types (leave empty for all events)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {availableEventTypes.map(eventType => (
                  <label
                    key={eventType}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px',
                      background: formData.event_types.includes(eventType) ? '#e6fffa' : '#f7fafc',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: `1px solid ${formData.event_types.includes(eventType) ? '#38b2ac' : '#e2e8f0'}`
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.event_types.includes(eventType)}
                      onChange={() => toggleEventType(eventType)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#2d3748' }}>{eventType}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingWebhook(null);
                  setFormData({ name: '', url: '', event_types: [] });
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568'
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingWebhook ? handleUpdate : handleCreate}
                disabled={!formData.name || !formData.url}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: (!formData.name || !formData.url)
                    ? '#cbd5e0'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: (!formData.name || !formData.url) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secret Display Modal */}
      {createdSecret && (
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
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            padding: '32px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1a202c' }}>
              ✅ Webhook Created!
            </h2>

            <div style={{
              background: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{ color: '#92400e', fontWeight: 600, margin: '0 0 8px', fontSize: '14px' }}>
                ⚠️ Save this secret now!
              </p>
              <p style={{ color: '#a16207', fontSize: '13px', margin: 0 }}>
                This is the only time you'll see the full webhook secret. Store it securely - you'll need it to verify webhook signatures.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#2d3748', fontSize: '13px' }}>
                Webhook Secret:
              </label>
              <div style={{
                background: '#f7fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '12px'
              }}>
                <code style={{
                  color: '#1a202c',
                  fontSize: '13px',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }}>
                  {createdSecret}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(createdSecret)}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📋 Copy Secret to Clipboard
              </button>
            </div>

            <button
              onClick={closeSecretModal}
              style={{
                width: '100%',
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid #cbd5e0',
                background: '#fff',
                color: '#4a5568',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              Done - I've Saved the Secret
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
