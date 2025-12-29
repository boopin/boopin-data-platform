'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Visitor {
  id: string;
  anonymous_id: string;
  email: string;
  name: string;
  phone: string;
  first_seen_at: string;
  last_seen_at: string;
  visit_count: number;
  is_identified: boolean;
}

interface Event {
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
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  properties: string;
}

export default function VisitorProfilePage() {
  const params = useParams();
  const visitorId = params.id as string;
  
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/visitors/${visitorId}`);
        const data = await res.json();
        setVisitor(data.visitor);
        setEvents(data.events || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (visitorId) fetchProfile();
  }, [visitorId]);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const eventColors: Record<string, string> = {
    page_view: '#3b82f6',
    click: '#10b981',
    button_click: '#06b6d4',
    form_submit: '#8b5cf6',
    identify: '#f59e0b',
    page_leave: '#ef4444',
  };

  const eventIcons: Record<string, string> = {
    page_view: '👁️',
    click: '👆',
    button_click: '🔘',
    form_submit: '📝',
    identify: '🎯',
    page_leave: '👋',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#f87171' }}>Visitor not found</p>
      </div>
    );
  }

  // Group events by date
  const eventsByDate: Record<string, Event[]> = {};
  events.forEach(event => {
    const date = new Date(event.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!eventsByDate[date]) eventsByDate[date] = [];
    eventsByDate[date].push(event);
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.95)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 700 }}>Boopin Data Platform</h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Customer Profile</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/visitors" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Visitors</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Back Button */}
        <Link href="/visitors" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
          ← Back to Visitors
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
          {/* Profile Card */}
          <div>
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '64px', height: '64px', background: visitor.is_identified ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  {visitor.is_identified ? '👤' : '❓'}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 700 }}>{visitor.name || 'Anonymous Visitor'}</h2>
                  <span style={{ 
                    background: visitor.is_identified ? '#10b98120' : '#f59e0b20', 
                    color: visitor.is_identified ? '#10b981' : '#f59e0b', 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '11px', 
                    fontWeight: 500 
                  }}>
                    {visitor.is_identified ? 'Identified' : 'Anonymous'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '11px', textTransform: 'uppercase' }}>Email</p>
                  <p style={{ color: '#22d3ee', margin: '4px 0 0', fontSize: '14px' }}>{visitor.email || '-'}</p>
                </div>
                <div>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '11px', textTransform: 'uppercase' }}>Phone</p>
                  <p style={{ color: '#e2e8f0', margin: '4px 0 0', fontSize: '14px' }}>{visitor.phone || '-'}</p>
                </div>
                <div>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '11px', textTransform: 'uppercase' }}>Visitor ID</p>
                  <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{visitor.anonymous_id}</p>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#fff', fontWeight: 600 }}>📊 Activity Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ color: '#3b82f6', margin: 0, fontSize: '24px', fontWeight: 700 }}>{visitor.visit_count}</p>
                  <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '11px' }}>Total Visits</p>
                </div>
                <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ color: '#8b5cf6', margin: 0, fontSize: '24px', fontWeight: 700 }}>{events.length}</p>
                  <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '11px' }}>Total Events</p>
                </div>
                <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ color: '#10b981', margin: 0, fontSize: '24px', fontWeight: 700 }}>{events.filter(e => e.event_type === 'page_view').length}</p>
                  <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '11px' }}>Page Views</p>
                </div>
                <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ color: '#f59e0b', margin: 0, fontSize: '24px', fontWeight: 700 }}>{Object.keys(eventsByDate).length}</p>
                  <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '11px' }}>Days Active</p>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>First Seen</span>
                  <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{formatDate(visitor.first_seen_at)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Last Seen</span>
                  <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{formatDate(visitor.last_seen_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 600 }}>🕐 Activity Timeline</h2>
              <span style={{ color: '#64748b', fontSize: '12px' }}>{events.length} events</span>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '20px' }}>
              {Object.entries(eventsByDate).map(([date, dateEvents]) => (
                <div key={date} style={{ marginBottom: '24px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginBottom: '12px', background: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}>
                    📅 {date}
                  </div>
                  <div style={{ borderLeft: '2px solid #334155', marginLeft: '8px', paddingLeft: '20px' }}>
                    {dateEvents.map((event, i) => (
                      <div key={event.id} style={{ marginBottom: i < dateEvents.length - 1 ? '16px' : 0, position: 'relative' }}>
                        <div style={{ 
                          position: 'absolute', 
                          left: '-26px', 
                          top: '4px',
                          width: '12px', 
                          height: '12px', 
                          background: eventColors[event.event_type] || '#64748b', 
                          borderRadius: '50%',
                          border: '2px solid #1e293b'
                        }}></div>
                        <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px' }}>{eventIcons[event.event_type] || '📌'}</span>
                              <span style={{ 
                                background: `${eventColors[event.event_type] || '#64748b'}20`, 
                                color: eventColors[event.event_type] || '#94a3b8', 
                                padding: '4px 10px', 
                                borderRadius: '6px', 
                                fontSize: '12px',
                                fontWeight: 500
                              }}>
                                {event.event_type.replace('_', ' ')}
                              </span>
                            </div>
                            <span style={{ color: '#64748b', fontSize: '11px' }}>
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {event.page_path && (
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                              <span style={{ color: '#64748b' }}>Page:</span> {event.page_path}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11px', color: '#64748b' }}>
                            {event.browser && <span>🌐 {event.browser}</span>}
                            {event.os && <span>💻 {event.os}</span>}
                            {event.device_type && <span>📱 {event.device_type}</span>}
                            {event.country && event.country !== 'Unknown' && <span>📍 {event.city || ''}{event.city && event.country ? ', ' : ''}{event.country}</span>}
                          </div>
                          {event.utm_source && (
                            <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                              <span style={{ color: '#f59e0b' }}>UTM:</span> {event.utm_source}{event.utm_medium ? ` / ${event.utm_medium}` : ''}{event.utm_campaign ? ` / ${event.utm_campaign}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '32px' }}>No events recorded yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
