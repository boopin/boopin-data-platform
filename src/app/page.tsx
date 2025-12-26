console.log('NEW PAGE LOADED');
'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalVisitors: number;
  totalPageViews: number;
  totalEvents: number;
  identifiedVisitors: number;
}

interface RecentEvent {
  id: string;
  event_type: string;
  page_path: string;
  timestamp: string;
  visitor_id: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const data = await res.json();
        setStats(data.stats);
        setRecentEvents(data.recentEvents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const styles = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    } as React.CSSProperties,
    header: {
      borderBottom: '1px solid rgba(71, 85, 105, 0.5)',
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
    } as React.CSSProperties,
    headerInner: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as React.CSSProperties,
    logo: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '12px',
    } as React.CSSProperties,
    title: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#ffffff',
      margin: 0,
    } as React.CSSProperties,
    subtitle: {
      fontSize: '14px',
      color: '#94a3b8',
      margin: 0,
    } as React.CSSProperties,
    main: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '32px 24px',
    } as React.CSSProperties,
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '24px',
      marginBottom: '32px',
    } as React.CSSProperties,
    card: {
      background: 'rgba(30, 41, 59, 0.5)',
      backdropFilter: 'blur(8px)',
      borderRadius: '16px',
      border: '1px solid rgba(71, 85, 105, 0.5)',
      padding: '24px',
    } as React.CSSProperties,
    cardIcon: (color: string) => ({
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    } as React.CSSProperties),
    cardLabel: {
      fontSize: '14px',
      color: '#94a3b8',
      marginBottom: '4px',
    } as React.CSSProperties,
    cardValue: {
      fontSize: '32px',
      fontWeight: 700,
      color: '#ffffff',
      margin: '0 0 4px 0',
    } as React.CSSProperties,
    cardSubtext: {
      fontSize: '13px',
      color: '#64748b',
    } as React.CSSProperties,
    section: {
      background: 'rgba(30, 41, 59, 0.5)',
      backdropFilter: 'blur(8px)',
      borderRadius: '16px',
      border: '1px solid rgba(71, 85, 105, 0.5)',
      overflow: 'hidden',
      marginBottom: '24px',
    } as React.CSSProperties,
    sectionHeader: {
      padding: '16px 24px',
      borderBottom: '1px solid rgba(71, 85, 105, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as React.CSSProperties,
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#ffffff',
      margin: 0,
    } as React.CSSProperties,
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    } as React.CSSProperties,
    th: {
      padding: '12px 24px',
      textAlign: 'left' as const,
      fontSize: '12px',
      fontWeight: 500,
      color: '#94a3b8',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    } as React.CSSProperties,
    td: {
      padding: '16px 24px',
      borderTop: '1px solid rgba(71, 85, 105, 0.3)',
    } as React.CSSProperties,
    badge: (color: string, bg: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 500,
      color: color,
      background: bg,
      border: `1px solid ${color}33`,
    } as React.CSSProperties),
    code: {
      background: '#0f172a',
      borderRadius: '12px',
      padding: '16px',
      overflow: 'auto',
      fontSize: '13px',
      fontFamily: 'Monaco, Consolas, monospace',
      color: '#e2e8f0',
    } as React.CSSProperties,
    emptyState: {
      padding: '48px 24px',
      textAlign: 'center' as const,
      color: '#64748b',
    } as React.CSSProperties,
  };

  const badgeStyles: Record<string, { color: string; bg: string }> = {
    page_view: { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
    click: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' },
    form_submit: { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' },
    identify: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
    button_click: { color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.15)' },
    page_leave: { color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', height: '48px', border: '4px solid #06b6d4', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>Loading dashboard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '24px', maxWidth: '400px' }}>
          <p style={{ color: '#f87171', margin: 0 }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  const conversionRate = stats && stats.totalVisitors > 0 
    ? ((stats.identifiedVisitors / stats.totalVisitors) * 100).toFixed(1)
    : '0';

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatPagePath = (path: string) => {
    if (!path) return '-';
    if (path.includes('/Users/') || path.includes('/home/') || path.includes('\\')) {
      const parts = path.split(/[/\\]/);
      return '/' + (parts.pop() || 'local');
    }
    return path.length > 35 ? path.substring(0, 35) + '...' : path;
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={styles.logo}>
              <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 style={styles.title}>Boopin Data Platform</h1>
              <p style={styles.subtitle}>1st Party Analytics</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 2px 0' }}>
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: 500, margin: 0 }}>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.card}>
            <div style={styles.cardIcon('linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)')}>
              <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p style={styles.cardLabel}>Total Visitors</p>
            <p style={styles.cardValue}>{stats?.totalVisitors.toLocaleString() || 0}</p>
            <p style={styles.cardSubtext}>Unique visitors</p>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon('linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')}>
              <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p style={styles.cardLabel}>Page Views</p>
            <p style={styles.cardValue}>{stats?.totalPageViews.toLocaleString() || 0}</p>
            <p style={styles.cardSubtext}>Total views</p>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon('linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)')}>
              <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p style={styles.cardLabel}>Total Events</p>
            <p style={styles.cardValue}>{stats?.totalEvents.toLocaleString() || 0}</p>
            <p style={styles.cardSubtext}>All interactions</p>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon('linear-gradient(135deg, #10b981 0%, #059669 100%)')}>
              <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p style={styles.cardLabel}>Identified Users</p>
            <p style={styles.cardValue}>{stats?.identifiedVisitors.toLocaleString() || 0}</p>
            <p style={styles.cardSubtext}>{conversionRate}% conversion</p>
          </div>
        </div>

        {/* Recent Events */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Events</h2>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>{recentEvents.length} events</span>
          </div>
          
          {recentEvents.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No events yet. Install the tracking pixel to start collecting data.</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Event</th>
                  <th style={styles.th}>Page</th>
                  <th style={styles.th}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.slice(0, 15).map((event) => {
                  const badgeStyle = badgeStyles[event.event_type] || { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
                  return (
                    <tr key={event.id}>
                      <td style={styles.td}>
                        <span style={styles.badge(badgeStyle.color, badgeStyle.bg)}>
                          {event.event_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#cbd5e1', fontFamily: 'Monaco, Consolas, monospace', fontSize: '13px' }}>
                        {formatPagePath(event.page_path)}
                      </td>
                      <td style={{ ...styles.td, color: '#64748b', fontSize: '14px' }}>
                        {formatTime(event.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Install Pixel */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Install Tracking Pixel</h2>
          </div>
          <div style={{ padding: '24px' }}>
            <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
              Add this script before the closing <code style={{ color: '#22d3ee' }}>&lt;/body&gt;</code> tag:
            </p>
            <pre style={styles.code}>
{`<script>
(function(w,d,s,u,k){
  w._bp=w._bp||[];w._bp.push(['init',k]);
  var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s);
  j.async=true;j.src=u;
  f.parentNode.insertBefore(j,f);
})(window,document,'script',
  '${typeof window !== 'undefined' ? window.location.origin : 'https://boopin-data-platform.vercel.app'}/pixel.js',
  'YOUR_API_KEY');
</script>`}
            </pre>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '12px' }}>
              Replace <code style={{ color: '#22d3ee' }}>YOUR_API_KEY</code> with your client API key.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
