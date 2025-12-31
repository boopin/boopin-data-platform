'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Visitor {
  id: string;
  anonymous_id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  first_seen_at: string;
  last_seen_at: string;
  visit_count: number;
  is_identified: boolean;
  properties: Record<string, unknown>;
}

interface Event {
  id: string;
  event_type: string;
  page_path: string;
  page_title: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  device_type: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

interface Session {
  date: string;
  events: Event[];
  duration: number;
  pageViews: number;
  startTime: string;
  endTime: string;
}

export default function VisitorDetailPage() {
  const params = useParams();
  const visitorId = params.id as string;
  
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'journey'>('profile');
  const [activeSession, setActiveSession] = useState<number>(0);

  useEffect(() => {
    async function fetchVisitorData() {
      try {
        const res = await fetch(`/api/visitors/${visitorId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setVisitor(data.visitor);
        setEvents(data.events || []);
        
        const groupedSessions = groupEventsIntoSessions(data.events || []);
        setSessions(groupedSessions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (visitorId) {
      fetchVisitorData();
    }
  }, [visitorId]);

  function groupEventsIntoSessions(events: Event[]): Session[] {
    if (events.length === 0) return [];
    
    const sorted = events.slice().sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const sessions: Session[] = [];
    let currentSession: Event[] = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const prevTime = new Date(sorted[i - 1].timestamp).getTime();
      const currTime = new Date(sorted[i].timestamp).getTime();
      const gapMinutes = (currTime - prevTime) / (1000 * 60);
      
      if (gapMinutes > 30) {
        sessions.push(createSession(currentSession));
        currentSession = [sorted[i]];
      } else {
        currentSession.push(sorted[i]);
      }
    }
    
    sessions.push(createSession(currentSession));
    return sessions.reverse();
  }

  function createSession(events: Event[]): Session {
    const startTime = events[0].timestamp;
    const endTime = events[events.length - 1].timestamp;
    const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
    const pageViews = events.filter(e => e.event_type === 'page_view').length;
    
    return {
      date: new Date(startTime).toLocaleDateString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
      }),
      events: events,
      duration: duration,
      pageViews: pageViews,
      startTime: startTime,
      endTime: endTime
    };
  }

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
  }

  function formatDuration(seconds: number) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  }

  function formatDateTime(timestamp: string) {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  const eventIcons: Record<string, string> = {
    page_view: '📄',
    click: '👆',
    button_click: '🔘',
    form_submit: '📝',
    identify: '👤',
    page_leave: '👋',
    scroll: '📜',
    video_play: '▶️',
    download: '⬇️',
    signup: '✨',
    login: '🔐',
    purchase: '💳'
  };

  const eventColors: Record<string, string> = {
    page_view: '#3b82f6',
    click: '#10b981',
    button_click: '#06b6d4',
    form_submit: '#8b5cf6',
    identify: '#f59e0b',
    page_leave: '#ef4444',
    scroll: '#64748b',
    video_play: '#ec4899',
    download: '#14b8a6',
    signup: '#22c55e',
    login: '#6366f1',
    purchase: '#eab308'
  };

  // Get unique values from events for profile stats - using Array.from for TS compatibility
  const uniqueCountries = Array.from(new Set(events.map(e => e.country).filter(Boolean)));
  const uniqueCities = Array.from(new Set(events.map(e => e.city).filter(Boolean)));
  const uniqueDevices = Array.from(new Set(events.map(e => e.device_type).filter(Boolean)));
  const uniqueBrowsers = Array.from(new Set(events.map(e => e.browser).filter(Boolean)));
  const uniqueUtmSources = Array.from(new Set(events.map(e => e.utm_source).filter(Boolean)));
  const topPages = events
    .filter(e => e.event_type === 'page_view')
    .reduce((acc, e) => {
      acc[e.page_path] = (acc[e.page_path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  const sortedPages = Object.entries(topPages).sort((a, b) => b[1] - a[1]).slice(0, 10);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading visitor data...</p>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#f87171' }}>Visitor not found</p>
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
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Visitor Details</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/visitors" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Visitors</Link>
            <Link href="/segments" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Segments</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link href="/visitors" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>
            ← Back to Visitors
          </Link>
        </div>

        {/* Visitor Profile Card */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            {/* Left: Identity */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: visitor.is_identified 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'linear-gradient(135deg, #64748b, #475569)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {visitor.is_identified ? '👤' : '👻'}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: 700 }}>
                  {visitor.name || visitor.email || 'Anonymous Visitor'}
                </h2>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {visitor.email && (
                    <span style={{ color: '#22d3ee', fontSize: '14px' }}>✉️ {visitor.email}</span>
                  )}
                  {visitor.phone && (
                    <span style={{ color: '#a78bfa', fontSize: '14px' }}>📱 {visitor.phone}</span>
                  )}
                  <span style={{ 
                    background: visitor.is_identified ? '#10b98120' : '#64748b20',
                    color: visitor.is_identified ? '#10b981' : '#64748b',
                    padding: '2px 10px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {visitor.is_identified ? '✓ Identified' : 'Anonymous'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Stats */}
            <div style={{ display: 'flex', gap: '32px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Total Visits</p>
                <p style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '4px 0 0' }}>{visitor.visit_count}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Total Events</p>
                <p style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '4px 0 0' }}>{events.length}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Sessions</p>
                <p style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '4px 0 0' }}>{sessions.length}</p>
              </div>
            </div>
          </div>

          {/* Timeline bar */}
          <div style={{ marginTop: '24px', padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>First Seen</p>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0' }}>{formatDateTime(visitor.first_seen_at)}</p>
              </div>
              <div style={{ flex: 1, margin: '0 24px', height: '4px', background: '#334155', borderRadius: '2px', position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: 0, 
                  top: 0, 
                  height: '100%', 
                  width: '100%', 
                  background: 'linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6)', 
                  borderRadius: '2px' 
                }}></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Last Seen</p>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0' }}>{formatDateTime(visitor.last_seen_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              background: activeTab === 'profile' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : '#334155',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            👤 Profile
          </button>
          <button
            onClick={() => setActiveTab('journey')}
            style={{
              background: activeTab === 'journey' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : '#334155',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🛤️ Journey Timeline
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {/* Identity Card */}
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '16px', fontWeight: 600 }}>🆔 Identity Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Visitor ID</span>
                  <span style={{ color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace' }}>{visitor.id.slice(0, 18)}...</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Anonymous ID</span>
                  <span style={{ color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace' }}>{visitor.anonymous_id.slice(0, 18)}...</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Email</span>
                  <span style={{ color: '#22d3ee', fontSize: '13px' }}>{visitor.email || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Name</span>
                  <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{visitor.name || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Phone</span>
                  <span style={{ color: '#a78bfa', fontSize: '13px' }}>{visitor.phone || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Status</span>
                  <span style={{ 
                    background: visitor.is_identified ? '#10b98120' : '#64748b20',
                    color: visitor.is_identified ? '#10b981' : '#64748b',
                    padding: '2px 10px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {visitor.is_identified ? 'Identified' : 'Anonymous'}
                  </span>
                </div>
              </div>
            </div>

            {/* Location & Device */}
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '16px', fontWeight: 600 }}>📍 Location & Device</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Countries</span>
                  <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{uniqueCountries.join(', ') || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Cities</span>
                  <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{uniqueCities.join(', ') || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Devices</span>
                  <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{uniqueDevices.join(', ') || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Browsers</span>
                  <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{uniqueBrowsers.join(', ') || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Traffic Sources</span>
                  <span style={{ color: '#f59e0b', fontSize: '13px' }}>{uniqueUtmSources.join(', ') || 'Direct'}</span>
                </div>
              </div>
            </div>

            {/* Top Pages */}
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '16px', fontWeight: 600 }}>📄 Top Pages Visited</h3>
              {sortedPages.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No page views recorded</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sortedPages.map(([page, count], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#0f172a', borderRadius: '6px' }}>
                      <span style={{ color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace' }}>{page}</span>
                      <span style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 600 }}>{count}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Properties */}
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '16px', fontWeight: 600 }}>⚙️ Custom Properties</h3>
              {!visitor.properties || Object.keys(visitor.properties).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No custom properties</p>
              ) : (
                <pre style={{ color: '#e2e8f0', fontSize: '12px', margin: 0, background: '#0f172a', padding: '12px', borderRadius: '6px', overflow: 'auto' }}>
                  {JSON.stringify(visitor.properties, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Journey Tab */}
        {activeTab === 'journey' && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
            {/* Sessions List */}
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #334155' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 600 }}>📅 Sessions</h3>
              </div>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {sessions.length === 0 ? (
                  <p style={{ padding: '24px', color: '#64748b', textAlign: 'center' }}>No sessions recorded</p>
                ) : (
                  sessions.map((session, index) => (
                    <div 
                      key={index}
                      onClick={() => setActiveSession(index)}
                      style={{ 
                        padding: '16px', 
                        borderBottom: '1px solid #334155', 
                        cursor: 'pointer',
                        background: activeSession === index ? '#334155' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                        {session.date}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0' }}>
                        {formatTime(session.startTime)}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <span style={{ color: '#3b82f6', fontSize: '12px' }}>
                          📄 {session.pageViews} pages
                        </span>
                        <span style={{ color: '#10b981', fontSize: '12px' }}>
                          ⏱️ {formatDuration(session.duration)}
                        </span>
                        <span style={{ color: '#f59e0b', fontSize: '12px' }}>
                          ⚡ {session.events.length} events
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Event Timeline */}
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                  🛤️ Event Timeline
                  {sessions[activeSession] && (
                    <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '8px' }}>
                      — {sessions[activeSession].date}
                    </span>
                  )}
                </h3>
                <span style={{ color: '#64748b', fontSize: '13px' }}>
                  {sessions[activeSession]?.events.length || 0} events
                </span>
              </div>
              <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '16px' }}>
                {!sessions[activeSession] || sessions[activeSession].events.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '24px' }}>No events in this session</p>
                ) : (
                  <div style={{ position: 'relative' }}>
                    {/* Timeline line */}
                    <div style={{ 
                      position: 'absolute', 
                      left: '20px', 
                      top: '24px', 
                      bottom: '24px', 
                      width: '2px', 
                      background: '#334155' 
                    }}></div>
                    
                    {sessions[activeSession].events.map((event) => (
                      <div key={event.id} style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        marginBottom: '16px',
                        position: 'relative'
                      }}>
                        {/* Timeline dot */}
                        <div style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '50%', 
                          background: `${eventColors[event.event_type] || '#64748b'}20`,
                          border: `2px solid ${eventColors[event.event_type] || '#64748b'}`,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0,
                          zIndex: 1
                        }}>
                          {eventIcons[event.event_type] || '⚡'}
                        </div>
                        
                        {/* Event card */}
                        <div style={{ 
                          flex: 1, 
                          background: '#0f172a', 
                          borderRadius: '8px', 
                          padding: '12px 16px',
                          border: '1px solid #334155'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{ 
                              background: `${eventColors[event.event_type] || '#64748b'}20`,
                              color: eventColors[event.event_type] || '#94a3b8',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}>
                              {event.event_type.replace('_', ' ')}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>
                              {formatTime(event.timestamp)}
                            </span>
                          </div>
                          
                          {event.page_path && (
                            <p style={{ 
                              color: '#e2e8f0', 
                              fontSize: '14px', 
                              margin: '8px 0 0',
                              fontFamily: 'monospace',
                              wordBreak: 'break-all'
                            }}>
                              {event.page_path}
                            </p>
                          )}
                          
                          {event.page_title && (
                            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
                              {event.page_title}
                            </p>
                          )}
                          
                          <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                            {event.device_type && (
                              <span style={{ color: '#64748b', fontSize: '11px' }}>
                                {event.device_type === 'desktop' ? '🖥️' : event.device_type === 'mobile' ? '📱' : '📟'} {event.device_type}
                              </span>
                            )}
                            {event.browser && (
                              <span style={{ color: '#64748b', fontSize: '11px' }}>
                                🌐 {event.browser}
                              </span>
                            )}
                            {event.country && (
                              <span style={{ color: '#64748b', fontSize: '11px' }}>
                                📍 {event.city ? `${event.city}, ` : ''}{event.country}
                              </span>
                            )}
                            {event.utm_source && (
                              <span style={{ color: '#64748b', fontSize: '11px' }}>
                                🔗 {event.utm_source}
                              </span>
                            )}
                          </div>
                          
                          {event.referrer && (
                            <p style={{ color: '#64748b', fontSize: '11px', margin: '8px 0 0' }}>
                              Referrer: {event.referrer}
                            </p>
                          )}
                          
                          {event.properties && Object.keys(event.properties).length > 0 && (
                            <div style={{ marginTop: '8px', padding: '8px', background: '#1e293b', borderRadius: '4px' }}>
                              <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 4px' }}>Properties:</p>
                              <pre style={{ color: '#94a3b8', fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(event.properties, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
