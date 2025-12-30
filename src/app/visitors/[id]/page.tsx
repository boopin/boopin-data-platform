'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface VisitorData {
  visitor: {
    id: string;
    email: string;
    name: string;
    phone: string;
    anonymous_id: string;
    first_seen_at: string;
    last_seen_at: string;
    visit_count: number;
    is_identified: boolean;
  };
  events: Array<{
    id: string;
    event_type: string;
    page_path: string;
    page_url: string;
    timestamp: string;
    device_type: string;
    browser: string;
    os: string;
    country: string;
    city: string;
    properties: Record<string, unknown>;
  }>;
  stats?: {
    totalEvents: number;
    pageViews: number;
    formSubmits: number;
    purchases: number;
  };
}

interface IdentityRecord {
  name?: string;
  email?: string;
  phone?: string;
  timestamp: string;
  properties: Record<string, unknown>;
}

export default function VisitorProfilePage() {
  const params = useParams();
  const [data, setData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'identity'>('timeline');

  useEffect(() => {
    const fetchVisitor = async () => {
      try {
        const response = await fetch(`/api/visitors/${params.id}`);
        if (!response.ok) throw new Error('Visitor not found');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('Failed to load visitor');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchVisitor();
    }
  }, [params.id]);

  // Extract all identity events and build history
  const getIdentityHistory = (): IdentityRecord[] => {
    if (!data) return [];
    
    const identityEvents = data.events
      .filter(e => e.event_type === 'identify')
      .map(e => ({
        name: e.properties?.name as string | undefined,
        email: e.properties?.email as string | undefined,
        phone: e.properties?.phone as string | undefined,
        timestamp: e.timestamp,
        properties: e.properties
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return identityEvents;
  };

  // Get unique identities (deduplicated)
  const getUniqueIdentities = () => {
    const history = getIdentityHistory();
    const uniqueEmails = new Set<string>();
    const uniqueNames = new Set<string>();
    const uniquePhones = new Set<string>();
    
    history.forEach(record => {
      if (record.email) uniqueEmails.add(record.email.toLowerCase());
      if (record.name) uniqueNames.add(record.name);
      if (record.phone) uniquePhones.add(record.phone);
    });
    
    return {
      emails: Array.from(uniqueEmails),
      names: Array.from(uniqueNames),
      phones: Array.from(uniquePhones),
      hasConflict: uniqueEmails.size > 1 || uniqueNames.size > 1
    };
  };

  const identityHistory = getIdentityHistory();
  const uniqueIdentities = getUniqueIdentities();

  // Default stats if not provided by API
  const stats = data?.stats || {
    totalEvents: data?.events?.length || 0,
    pageViews: data?.events?.filter(e => e.event_type === 'page_view').length || 0,
    formSubmits: data?.events?.filter(e => e.event_type === 'form_submit').length || 0,
    purchases: data?.events?.filter(e => e.event_type === 'purchase').length || 0
  };

  const eventColors: Record<string, string> = { 
    page_view: '#3b82f6', click: '#10b981', button_click: '#06b6d4', 
    form_submit: '#8b5cf6', identify: '#f59e0b', page_leave: '#ef4444',
    scroll_depth: '#a855f7', time_on_page: '#ec4899', form_start: '#14b8a6',
    form_abandon: '#f97316', outbound_click: '#06b6d4', product_view: '#8b5cf6',
    add_to_cart: '#22c55e', remove_from_cart: '#ef4444', cart_view: '#3b82f6',
    begin_checkout: '#f59e0b', purchase: '#10b981', cart_abandon: '#ef4444',
    lead_form: '#8b5cf6', video_start: '#6366f1', video_progress: '#a855f7',
    video_complete: '#22c55e', file_download: '#06b6d4', search: '#f59e0b',
    share: '#ec4899', sign_up: '#10b981', login: '#3b82f6', logout: '#64748b'
  };

  const eventIcons: Record<string, string> = {
    page_view: '👁️', click: '👆', button_click: '🔘', form_submit: '📝',
    identify: '👤', page_leave: '🚪', scroll_depth: '📜', time_on_page: '⏱️',
    form_start: '✏️', form_abandon: '❌', outbound_click: '🔗', product_view: '🛍️',
    add_to_cart: '🛒', remove_from_cart: '🗑️', cart_view: '🛒', begin_checkout: '💳',
    purchase: '✅', cart_abandon: '🛒', lead_form: '📋', video_start: '▶️',
    video_progress: '⏩', video_complete: '🎬', file_download: '📥', search: '🔍',
    share: '📤', sign_up: '🆕', login: '🔑', logout: '🚶'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#e2e8f0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
          <p>Loading visitor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p>{error || 'Visitor not found'}</p>
          <a href="/visitors" style={{ color: '#22d3ee', marginTop: '16px', display: 'inline-block' }}>← Back to Visitors</a>
        </div>
      </div>
    );
  }

  const { visitor, events } = data;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px' }}>
      {/* Header */}
      <header style={{ marginBottom: '24px' }}>
        <nav style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
          <a href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</a>
          <span style={{ color: '#475569' }}>/</span>
          <a href="/visitors" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Visitors</a>
          <span style={{ color: '#475569' }}>/</span>
          <span style={{ color: '#e2e8f0', fontSize: '14px' }}>Profile</span>
        </nav>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
        {/* Left Sidebar - Profile Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Primary Identity Card */}
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '24px'
              }}>
                {(visitor.name || visitor.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
                  {visitor.name || 'Anonymous'}
                </h1>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>
                  {visitor.is_identified ? '✓ Identified' : 'Anonymous Visitor'}
                </p>
              </div>
            </div>

            {/* Identity Conflict Warning */}
            {uniqueIdentities.hasConflict && (
              <div style={{ 
                background: '#fef3c7', 
                border: '1px solid #f59e0b', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <span style={{ color: '#92400e', fontWeight: 600, fontSize: '13px' }}>Multiple Identities Detected</span>
                </div>
                <p style={{ color: '#a16207', fontSize: '12px', margin: 0 }}>
                  This visitor has identified with {uniqueIdentities.emails.length} different email(s) 
                  {uniqueIdentities.names.length > 1 ? ` and ${uniqueIdentities.names.length} different name(s)` : ''}.
                  This could indicate a shared device or test data.
                </p>
              </div>
            )}

            {/* Primary Contact Info */}
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                <span style={{ fontSize: '16px' }}>📧</span>
                <div>
                  <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>Primary Email</p>
                  <p style={{ color: '#22d3ee', fontSize: '13px', margin: '2px 0 0', fontWeight: 500 }}>{visitor.email || 'Not provided'}</p>
                </div>
              </div>

              {visitor.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                  <span style={{ fontSize: '16px' }}>📱</span>
                  <div>
                    <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>Phone</p>
                    <p style={{ color: '#e2e8f0', fontSize: '13px', margin: '2px 0 0' }}>{visitor.phone}</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                <span style={{ fontSize: '16px' }}>🕐</span>
                <div>
                  <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>First Seen</p>
                  <p style={{ color: '#e2e8f0', fontSize: '13px', margin: '2px 0 0' }}>{new Date(visitor.first_seen_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                <span style={{ fontSize: '16px' }}>📅</span>
                <div>
                  <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>Last Active</p>
                  <p style={{ color: '#e2e8f0', fontSize: '13px', margin: '2px 0 0' }}>{new Date(visitor.last_seen_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '14px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> Engagement Stats
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Total Events', value: stats.totalEvents, color: '#3b82f6' },
                { label: 'Page Views', value: stats.pageViews, color: '#10b981' },
                { label: 'Form Submits', value: stats.formSubmits, color: '#8b5cf6' },
                { label: 'Purchases', value: stats.purchases, color: '#f59e0b' },
              ].map((stat, i) => (
                <div key={i} style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ color: stat.color, fontSize: '24px', fontWeight: 700, margin: 0 }}>{stat.value}</p>
                  <p style={{ color: '#64748b', fontSize: '10px', margin: '4px 0 0', textTransform: 'uppercase' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* All Known Identities */}
          {uniqueIdentities.emails.length > 0 && (
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <h2 style={{ color: '#f8fafc', fontSize: '14px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏷️</span> All Known Identities
              </h2>
              
              {uniqueIdentities.emails.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#64748b', fontSize: '10px', margin: '0 0 8px', textTransform: 'uppercase' }}>Emails ({uniqueIdentities.emails.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {uniqueIdentities.emails.map((email, i) => (
                      <span key={i} style={{ 
                        background: email === visitor.email?.toLowerCase() ? '#3b82f6' : '#334155', 
                        color: 'white', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '11px' 
                      }}>
                        {email} {email === visitor.email?.toLowerCase() && '(primary)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {uniqueIdentities.names.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#64748b', fontSize: '10px', margin: '0 0 8px', textTransform: 'uppercase' }}>Names ({uniqueIdentities.names.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {uniqueIdentities.names.map((name, i) => (
                      <span key={i} style={{ 
                        background: name === visitor.name ? '#8b5cf6' : '#334155', 
                        color: 'white', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '11px' 
                      }}>
                        {name} {name === visitor.name && '(primary)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {uniqueIdentities.phones.length > 0 && (
                <div>
                  <p style={{ color: '#64748b', fontSize: '10px', margin: '0 0 8px', textTransform: 'uppercase' }}>Phones ({uniqueIdentities.phones.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {uniqueIdentities.phones.map((phone, i) => (
                      <span key={i} style={{ 
                        background: phone === visitor.phone ? '#10b981' : '#334155', 
                        color: 'white', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '11px' 
                      }}>
                        {phone} {phone === visitor.phone && '(primary)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Technical Info */}
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '14px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔧</span> Technical Info
            </h2>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{ padding: '10px', background: '#0f172a', borderRadius: '6px' }}>
                <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>Visitor ID</p>
                <p style={{ color: '#94a3b8', fontSize: '10px', margin: '4px 0 0', fontFamily: 'monospace', wordBreak: 'break-all' }}>{visitor.id}</p>
              </div>
              <div style={{ padding: '10px', background: '#0f172a', borderRadius: '6px' }}>
                <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>Anonymous ID</p>
                <p style={{ color: '#94a3b8', fontSize: '10px', margin: '4px 0 0', fontFamily: 'monospace', wordBreak: 'break-all' }}>{visitor.anonymous_id}</p>
              </div>
              <div style={{ padding: '10px', background: '#0f172a', borderRadius: '6px' }}>
                <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>Total Visits</p>
                <p style={{ color: '#22d3ee', fontSize: '14px', margin: '4px 0 0', fontWeight: 600 }}>{visitor.visit_count}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Activity */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
            <button 
              onClick={() => setActiveTab('timeline')}
              style={{ 
                flex: 1, 
                padding: '16px', 
                background: activeTab === 'timeline' ? '#334155' : 'transparent',
                border: 'none',
                color: activeTab === 'timeline' ? '#f8fafc' : '#94a3b8',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>📜</span> Event Timeline ({events.length})
            </button>
            <button 
              onClick={() => setActiveTab('identity')}
              style={{ 
                flex: 1, 
                padding: '16px', 
                background: activeTab === 'identity' ? '#334155' : 'transparent',
                border: 'none',
                color: activeTab === 'identity' ? '#f8fafc' : '#94a3b8',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>👤</span> Identity History ({identityHistory.length})
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ padding: '20px', maxHeight: '700px', overflowY: 'auto' }}>
            {activeTab === 'timeline' ? (
              /* Event Timeline */
              <div>
                {events.map((event, i) => (
                  <a 
                    key={i}
                    href={`/events/${event.id}`}
                    style={{ 
                      display: 'flex', 
                      gap: '16px', 
                      padding: '16px', 
                      borderBottom: '1px solid #334155',
                      textDecoration: 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: eventColors[event.event_type] || '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0
                    }}>
                      {eventIcons[event.event_type] || '📌'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ 
                          background: eventColors[event.event_type] || '#64748b', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {event.event_type}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.page_path || 'N/A'}
                      </p>
                      {event.event_type === 'identify' && event.properties && (
                        <div style={{ marginTop: '8px', padding: '8px', background: '#0f172a', borderRadius: '6px' }}>
                          <p style={{ color: '#f59e0b', fontSize: '11px', margin: 0 }}>
                            Identified as: {String((event.properties as Record<string, unknown>).name || (event.properties as Record<string, unknown>).email || 'Unknown')}
                          </p>
                        </div>
                      )}
                      {event.event_type === 'purchase' && event.properties && (
                        <div style={{ marginTop: '8px', padding: '8px', background: '#0f172a', borderRadius: '6px' }}>
                          <p style={{ color: '#10b981', fontSize: '11px', margin: 0 }}>
                            💰 Order: {String((event.properties as Record<string, unknown>).order_id || '')} - {String((event.properties as Record<string, unknown>).currency || '')} {String((event.properties as Record<string, unknown>).total || '')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div style={{ color: '#475569', fontSize: '10px', textAlign: 'right', flexShrink: 0 }}>
                      {event.country && <p style={{ margin: 0 }}>{event.city}, {event.country}</p>}
                      <p style={{ margin: '4px 0 0' }}>{event.device_type} {event.device_type === 'mobile' ? '📱' : '💻'}</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              /* Identity History */
              <div>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
                  Chronological history of all identity events for this visitor. The primary identity is determined by the most recent complete identification.
                </p>
                {identityHistory.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No identify events found</p>
                ) : (
                  identityHistory.map((record, i) => (
                    <div 
                      key={i}
                      style={{ 
                        padding: '16px', 
                        background: '#0f172a', 
                        borderRadius: '8px',
                        marginBottom: '12px',
                        border: '1px solid #334155'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <span style={{ 
                          background: '#f59e0b', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '10px',
                          fontWeight: 600
                        }}>
                          IDENTIFY #{i + 1}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>
                          {new Date(record.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {record.name && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontSize: '12px', width: '60px' }}>Name:</span>
                            <span style={{ color: '#f8fafc', fontSize: '12px', fontWeight: 500 }}>{record.name}</span>
                          </div>
                        )}
                        {record.email && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontSize: '12px', width: '60px' }}>Email:</span>
                            <span style={{ color: '#22d3ee', fontSize: '12px' }}>{record.email}</span>
                          </div>
                        )}
                        {record.phone && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontSize: '12px', width: '60px' }}>Phone:</span>
                            <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{record.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
