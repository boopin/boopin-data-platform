'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Logo from '../../components/Logo';
import SiteSelector from '../../components/SiteSelector';

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
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <p>Loading live visitors...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Navigation />
            <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }} />
            <SiteSelector />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🔴</span>
              Live Visitors
            </h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
              Real-time view of visitors on your site right now • Updates every 5 seconds
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }}></div>
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 600 }}>LIVE</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
              Updated {formatTimeAgo(lastUpdate.toISOString())}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Live Visitors', value: data?.stats.totalLiveVisitors || 0, icon: '👥', color: '#10b981' },
            { label: 'Identified', value: data?.stats.identifiedVisitors || 0, icon: '👤', color: '#2563eb' },
            { label: 'Anonymous', value: data?.stats.anonymousVisitors || 0, icon: '👻', color: '#64748b' },
            { label: 'Total Events', value: data?.stats.totalEvents || 0, icon: '⚡', color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontWeight: 500 }}>{stat.label}</p>
                  <p style={{ color: stat.color, fontSize: '32px', fontWeight: 700, margin: '8px 0 0' }}>{stat.value}</p>
                </div>
                <span style={{ fontSize: '24px' }}>{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Visitors Feed */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: 600 }}>
              Active Visitors ({data?.visitors.length || 0})
            </h3>
          </div>

          {!data?.visitors || data.visitors.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👀</div>
              <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>No visitors online right now</p>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '8px 0 0' }}>Waiting for activity...</p>
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
                    borderBottom: '1px solid #e2e8f0',
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* New Visitor Badge */}
                  {isNewVisitor(visitor.first_seen_at) && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#10b981',
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
                      ? '#d1fae5'
                      : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                    border: `2px solid ${visitor.is_identified ? '#10b981' : '#cbd5e1'}`
                  }}>
                    {visitor.is_identified ? '👤' : '👻'}
                  </div>

                  {/* Visitor Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <p style={{ color: '#1e293b', fontSize: '15px', fontWeight: 600, margin: 0 }}>
                        {visitor.name || visitor.email || 'Anonymous Visitor'}
                      </p>
                      {visitor.is_identified && visitor.email && (
                        <span style={{ color: '#2563eb', fontSize: '12px' }}>({visitor.email})</span>
                      )}
                    </div>

                    {/* Current Page */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px' }}>📄</span>
                      <p style={{ color: '#64748b', fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                    <p style={{ color: '#10b981', fontSize: '12px', fontWeight: 600, margin: 0 }}>
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
