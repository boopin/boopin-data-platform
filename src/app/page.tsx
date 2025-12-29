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
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStats(data.stats);
        setRecentEvents(data.recentEvents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const dataTimer = setInterval(fetchData, 10000);
    const timeTimer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => {
      clearInterval(dataTimer);
      clearInterval(timeTimer);
    };
  }, []);

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#f87171' }}>Error: {error}</p>
      </div>
    );
  }

  const conversionRate = stats && stats.totalVisitors > 0 ? ((stats.identifiedVisitors / stats.totalVisitors) * 100).toFixed(1) : '0';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.9)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>Boopin Data Platform</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>1st Party Analytics</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>{currentTime.toLocaleString()}</p>
            <p style={{ color: '#22d3ee', margin: '4px 0 0', fontSize: '12px' }}>● Live - Auto-refresh 10s</p>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 8px', fontSize: '14px' }}>Total Visitors</p>
            <p style={{ color: '#fff', margin: 0, fontSize: '28px', fontWeight: 700 }}>{stats?.totalVisitors || 0}</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 8px', fontSize: '14px' }}>Page Views</p>
            <p style={{ color: '#fff', margin: 0, fontSize: '28px', fontWeight: 700 }}>{stats?.totalPageViews || 0}</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 8px', fontSize: '14px' }}>Total Events</p>
            <p style={{ color: '#fff', margin: 0, fontSize: '28px', fontWeight: 700 }}>{stats?.totalEvents || 0}</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 8px', fontSize: '14px' }}>Identified Users</p>
            <p style={{ color: '#fff', margin: 0, fontSize: '28px', fontWeight: 700 }}>{stats?.identifiedVisitors || 0}</p>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '12px' }}>{conversionRate}% conversion</p>
          </div>
        </div>

        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Recent Events</h2>
          </div>
          {recentEvents.length === 0 ? (
            <p style={{ padding: '32px', textAlign: 'center', color: '#64748b', margin: 0 }}>No events yet</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 20px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>EVENT</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>PAGE</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>DATE & TIME</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.slice(0, 10).map((e) => (
                  <tr key={e.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ background: '#3b82f620', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{e.event_type}</span>
                    </td>
                    <td style={{ padding: '12px 20px', color: '#cbd5e1', fontSize: '13px' }}>{e.page_path?.split('/').pop() || '-'}</td>
                    <td style={{ padding: '12px 20px', color: '#64748b', fontSize: '13px' }}>{formatDateTime(e.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '16px', color: '#fff' }}>Install Pixel</h2>
          <pre style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', overflow: 'auto', color: '#e2e8f0', fontSize: '12px', margin: 0 }}>
{`<script>
(function(w,d,s,u,k){
  w._bp=w._bp||[];w._bp.push(['init',k]);
  var f=d.getElementsByTagName(s)[0],j=d.createElement(s);
  j.async=true;j.src=u;f.parentNode.insertBefore(j,f);
})(window,document,'script',
'https://boopin-data-platform.vercel.app/pixel.js','YOUR_API_KEY');
</script>`}
          </pre>
        </div>
      </main>
    </div>
  );
}
