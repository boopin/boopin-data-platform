'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface EventData {
  id: string;
  event_type: string;
  page_path: string;
  page_url: string;
  timestamp: string;
  visitor_id: string;
  session_id: string;
  user_agent: string;
  device_type: string;
  browser: string;
  os: string;
  ip_address: string;
  country: string;
  city: string;
  region: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  properties: Record<string, unknown>;
  visitor_email?: string;
  visitor_name?: string;
  visitor_phone?: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${params.id}`);
        if (!response.ok) throw new Error('Event not found');
        const data = await response.json();
        setEvent(data.event);
      } catch (err) {
        setError('Failed to load event');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p>{error || 'Event not found'}</p>
          <a href="/" style={{ color: '#22d3ee', marginTop: '16px', display: 'inline-block' }}>← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px' }}>
      {/* Header */}
      <header style={{ marginBottom: '24px' }}>
        <a href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>← Back to Dashboard</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
          <span style={{ fontSize: '48px' }}>{eventIcons[event.event_type] || '📌'}</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#f8fafc' }}>
              Event Details
            </h1>
            <span style={{ 
              background: eventColors[event.event_type] || '#64748b', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'inline-block',
              marginTop: '8px'
            }}>
              {event.event_type}
            </span>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Basic Info */}
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '16px', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Basic Information
          </h2>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Event ID</span>
              <span style={{ color: '#64748b', fontSize: '12px' }}>{event.id}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Timestamp</span>
              <span style={{ color: '#e2e8f0' }}>{new Date(event.timestamp).toLocaleString()}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Page URL</span>
              <span style={{ color: '#22d3ee', fontSize: '12px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {event.page_url?.replace('file:///Users/boopin/Downloads/', '') || 'N/A'}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Page Path</span>
              <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{event.page_path?.replace('/Users/boopin/Downloads/', '') || 'N/A'}</span>
            </div>
            
            {event.referrer && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Referrer</span>
                <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{event.referrer}</span>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '16px', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👤</span> User Information
          </h2>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            {event.visitor_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Name</span>
                <span style={{ color: '#22d3ee', fontWeight: 500 }}>{event.visitor_name}</span>
              </div>
            )}
            
            {event.visitor_email && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Email</span>
                <span style={{ color: '#e2e8f0' }}>{event.visitor_email}</span>
              </div>
            )}
            
            {event.visitor_phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Phone</span>
                <span style={{ color: '#e2e8f0' }}>{event.visitor_phone}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Visitor ID</span>
              <span style={{ color: '#64748b', fontSize: '11px' }}>{event.visitor_id}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Session ID</span>
              <span style={{ color: '#64748b', fontSize: '11px' }}>{event.session_id || 'N/A'}</span>
            </div>
            
            <a 
              href={`/visitors/${event.visitor_id}`}
              style={{ 
                display: 'block',
                textAlign: 'center',
                padding: '12px',
                background: '#3b82f6',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 500,
                marginTop: '8px'
              }}
            >
              View Full Visitor Profile →
            </a>
          </div>
        </div>

        {/* Location & Device */}
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '16px', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌍</span> Location & Device
          </h2>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Country</span>
              <span style={{ color: '#e2e8f0' }}>{event.country || 'Unknown'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>City</span>
              <span style={{ color: '#e2e8f0' }}>{event.city || 'Unknown'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Region</span>
              <span style={{ color: '#e2e8f0' }}>{event.region || 'Unknown'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Device</span>
              <span style={{ color: '#e2e8f0' }}>{event.device_type || 'Unknown'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Browser</span>
              <span style={{ color: '#e2e8f0' }}>{event.browser || 'Unknown'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>OS</span>
              <span style={{ color: '#e2e8f0' }}>{event.os || 'Unknown'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8' }}>IP Address</span>
              <span style={{ color: '#64748b', fontSize: '12px' }}>{event.ip_address || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* UTM & Properties */}
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '16px', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏷️</span> UTM Parameters & Properties
          </h2>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            {event.utm_source && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>UTM Source</span>
                <span style={{ color: '#22d3ee' }}>{event.utm_source}</span>
              </div>
            )}
            
            {event.utm_medium && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>UTM Medium</span>
                <span style={{ color: '#e2e8f0' }}>{event.utm_medium}</span>
              </div>
            )}
            
            {event.utm_campaign && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>UTM Campaign</span>
                <span style={{ color: '#e2e8f0' }}>{event.utm_campaign}</span>
              </div>
            )}
            
            {!event.utm_source && !event.utm_medium && !event.utm_campaign && (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No UTM parameters</p>
            )}
            
            {event.properties && Object.keys(event.properties).length > 0 && (
              <>
                <h3 style={{ color: '#f8fafc', fontSize: '14px', margin: '16px 0 12px' }}>Event Properties</h3>
                <pre style={{ 
                  background: '#0f172a', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  color: '#22d3ee',
                  fontSize: '11px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(event.properties, null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
