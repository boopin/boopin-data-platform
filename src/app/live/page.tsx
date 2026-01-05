'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LiveVisitor {
  id: string;
  email: string | null;
  name: string | null;
  anonymous_id: string;
  is_identified: boolean;
  page_path: string;
  page_url: string;
  last_activity: string;
  device_type: string;
  browser: string;
  os: string;
  country: string | null;
  city: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  event_count: number;
  pages_viewed: number;
  time_on_site: number;
  first_seen_at: string;
}

interface LiveData {
  visitors: LiveVisitor[];
  stats: {
    totalLiveVisitors: number;
    identifiedVisitors: number;
    anonymousVisitors: number;
    totalEvents: number;
  };
  timestamp: string;
}

export default function LiveVisitorsPage() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchLiveVisitors = async () => {
    try {
      const response = await fetch('/api/live-visitors');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch live visitors:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveVisitors();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchLiveVisitors, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const isNewVisitor = (firstSeenAt: string) => {
    const firstSeenDate = new Date(firstSeenAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return firstSeenDate >= fiveMinutesAgo;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#e2e8f0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <p>Loading live visitors...</p>
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
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Live Visitors</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/visitors" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Visitors</Link>
            <Link href="/segments" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Segments</Link>
            <Link href="/reports" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Reports</Link>
            <Link href="/live" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Live</Link>
            <Link href="/goals" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Goals</Link>
            <Link href="/funnels" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Funnels</Link>
            <Link href="/settings/api-keys" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>API Keys</Link>
            <Link href="/settings/webhooks" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Webhooks</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🔴</span>
              Live Visitors
            </h2>
            <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Real-time view of visitors on your site right now • Updates every 5 seconds
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }}></div>
              <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600 }}>LIVE</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
              Updated {formatTimeAgo(lastUpdate.toISOString())}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Live Visitors', value: data?.stats.totalLiveVisitors || 0, icon: '👥', color: '#22c55e' },
            { label: 'Identified', value: data?.stats.identifiedVisitors || 0, icon: '👤', color: '#3b82f6' },
            { label: 'Anonymous', value: data?.stats.anonymousVisitors || 0, icon: '👻', color: '#64748b' },
            { label: 'Total Events', value: data?.stats.totalEvents || 0, icon: '⚡', color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{stat.label}</p>
                  <p style={{ color: stat.color, fontSize: '32px', fontWeight: 700, margin: '8px 0 0' }}>{stat.value}</p>
                </div>
                <span style={{ fontSize: '24px' }}>{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Visitors Feed */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 600 }}>
              Active Visitors ({data?.visitors.length || 0})
            </h3>
          </div>

          {!data?.visitors || data.visitors.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👀</div>
              <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>No visitors online right now</p>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '8px 0 0' }}>Waiting for activity...</p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {data.visitors.map((visitor, i) => (
                <Link
                  key={i}
                  href={`/visitors/${visitor.id}`}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '20px',
                    borderBottom: '1px solid #334155',
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* New Visitor Badge */}
                  {isNewVisitor(visitor.first_seen_at) && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#22c55e',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 600
                    }}>
                      NEW
                    </div>
                  )}

                  {/* Avatar */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: visitor.is_identified
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #64748b, #475569)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                  }}>
                    {visitor.is_identified ? '👤' : '👻'}
                  </div>

                  {/* Visitor Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <p style={{ color: '#f8fafc', fontSize: '15px', fontWeight: 600, margin: 0 }}>
                        {visitor.name || visitor.email || 'Anonymous Visitor'}
                      </p>
                      {visitor.is_identified && visitor.email && (
                        <span style={{ color: '#22d3ee', fontSize: '12px' }}>({visitor.email})</span>
                      )}
                    </div>

                    {/* Current Page */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px' }}>📄</span>
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {visitor.page_path || 'Unknown page'}
                      </p>
                    </div>

                    {/* Metrics */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px' }}>⏱️</span>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>
                          {formatDuration(visitor.time_on_site)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px' }}>📄</span>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>
                          {visitor.pages_viewed} pages
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px' }}>⚡</span>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>
                          {visitor.event_count} events
                        </span>
                      </div>
                      {visitor.country && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px' }}>📍</span>
                          <span style={{ color: '#64748b', fontSize: '12px' }}>
                            {visitor.city ? `${visitor.city}, ` : ''}{visitor.country}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px' }}>{visitor.device_type === 'mobile' ? '📱' : '💻'}</span>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>
                          {visitor.browser}
                        </span>
                      </div>
                    </div>

                    {/* Traffic Source */}
                    {visitor.utm_source && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px' }}>🔗</span>
                        <span style={{ color: '#f59e0b', fontSize: '12px' }}>
                          From: {visitor.utm_source}
                          {visitor.utm_medium && ` / ${visitor.utm_medium}`}
                          {visitor.utm_campaign && ` / ${visitor.utm_campaign}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Last Activity */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#22c55e', fontSize: '12px', fontWeight: 600, margin: 0 }}>
                      {formatTimeAgo(visitor.last_activity)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
