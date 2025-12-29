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
  page_url: string;
  timestamp: string;
  visitor_id: string;
  device_type: string;
  browser: string;
  os: string;
  referrer: string;
  utm_source: string;
  email: string;
  name: string;
}

interface BreakdownItem {
  name?: string;
  device_type?: string;
  page_path?: string;
  event_type?: string;
  source?: string;
  count: number | string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<BreakdownItem[]>([]);
  const [browserBreakdown, setBrowserBreakdown] = useState<BreakdownItem[]>([]);
  const [osBreakdown, setOsBreakdown] = useState<BreakdownItem[]>([]);
  const [topPages, setTopPages] = useState<BreakdownItem[]>([]);
  const [eventBreakdown, setEventBreakdown] = useState<BreakdownItem[]>([]);
  const [trafficSources, setTrafficSources] = useState<BreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStats(data.stats);
        setRecentEvents(data.recentEvents);
        setDeviceBreakdown(data.deviceBreakdown || []);
        setBrowserBreakdown(data.browserBreakdown || []);
        setOsBreakdown(data.osBreakdown || []);
        setTopPages(data.topPages || []);
        setEventBreakdown(data.eventBreakdown || []);
        setTrafficSources(data.trafficSources || []);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const dataTimer = setInterval(fetchData, 10000);
    const timeTimer = setInterval(() => setCurrentTime(new Date()), 1000);
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

  const getMaxCount = (items: BreakdownItem[]) => {
    return Math.max(...items.map(i => Number(i.count) || 0), 1);
  };

  const eventColors: Record<string, string> = {
    page_view: '#3b82f6',
    click: '#10b981',
    button_click: '#06b6d4',
    form_submit: '#8b5cf6',
    identify: '#f59e0b',
    page_leave: '#ef4444',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.95)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 700 }}>Boopin Data Platform</h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>1st Party Analytics Dashboard</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#e2e8f0', margin: 0, fontSize: '14px', fontWeight: 500 }}>{currentTime.toLocaleTimeString()}</p>
            <p style={{ color: '#22d3ee', margin: '2px 0 0', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', background: '#22d3ee', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
              Live • Updated {Math.round((currentTime.getTime() - lastUpdated.getTime()) / 1000)}s ago
            </p>
          </div>
        </div>
      </header>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Visitors', value: stats?.totalVisitors || 0, color: '#06b6d4', icon: '👥' },
            { label: 'Page Views', value: stats?.totalPageViews || 0, color: '#3b82f6', icon: '👁️' },
            { label: 'Total Events', value: stats?.totalEvents || 0, color: '#8b5cf6', icon: '⚡' },
            { label: 'Identified Users', value: stats?.identifiedVisitors || 0, color: '#10b981', icon: '✓', sub: `${conversionRate}% conversion` },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>{stat.label}</p>
                <span style={{ fontSize: '18px' }}>{stat.icon}</span>
              </div>
              <p style={{ color: '#fff', margin: 0, fontSize: '28px', fontWeight: 700 }}>{stat.value.toLocaleString()}</p>
              {stat.sub && <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '11px' }}>{stat.sub}</p>}
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Recent Events */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 600 }}>📊 Recent Events</h2>
              <span style={{ color: '#64748b', fontSize: '12px' }}>{recentEvents.length} events</span>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recentEvents.length === 0 ? (
                <p style={{ padding: '32px', textAlign: 'center', color: '#64748b', margin: 0 }}>No events yet</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0f172a' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>EVENT</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>DEVICE</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEvents.slice(0, 10).map((e) => (
                      <tr key={e.id} style={{ borderTop: '1px solid #334155' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: `${eventColors[e.event_type] || '#64748b'}20`, color: eventColors[e.event_type] || '#94a3b8', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{e.event_type}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{e.browser}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{e.os} • {e.device_type}</div>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px' }}>{formatDateTime(e.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Event Breakdown */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>⚡ Event Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {eventBreakdown.slice(0, 6).map((item, i) => {
                const type = item.event_type || 'unknown';
                const count = Number(item.count);
                const max = getMaxCount(eventBreakdown);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{type.replace('_', ' ')}</span>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{count}</span>
                    </div>
                    <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: eventColors[type] || '#64748b', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Three Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Browsers */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>🌐 Browsers</h2>
            {browserBreakdown.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {browserBreakdown.slice(0, 5).map((item, i) => {
                  const count = Number(item.count);
                  const max = getMaxCount(browserBreakdown);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{item.name}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: '#3b82f6', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Operating Systems */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>💻 Operating Systems</h2>
            {osBreakdown.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {osBreakdown.slice(0, 5).map((item, i) => {
                  const count = Number(item.count);
                  const max = getMaxCount(osBreakdown);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{item.name}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: '#8b5cf6', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Devices */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>📱 Devices</h2>
            {deviceBreakdown.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {deviceBreakdown.map((item, i) => {
                  const count = Number(item.count);
                  const max = getMaxCount(deviceBreakdown);
                  const deviceIcons: Record<string, string> = { desktop: '🖥️', mobile: '📱', tablet: '📟' };
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{deviceIcons[item.device_type || ''] || '❓'} {item.device_type}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: '#10b981', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Two Column - Pages & Sources */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Top Pages */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>📄 Top Pages</h2>
            {topPages.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topPages.map((item, i) => {
                  const count = Number(item.count);
                  const max = getMaxCount(topPages);
                  const path = item.page_path || '/';
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace' }}>{path.length > 30 ? path.slice(0, 30) + '...' : path}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: '#f59e0b', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Traffic Sources */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>🔗 Traffic Sources</h2>
            {trafficSources.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {trafficSources.map((item, i) => {
                  const count = Number(item.count);
                  const max = getMaxCount(trafficSources);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{item.source}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: '#ec4899', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Install Pixel */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>🔧 Install Tracking Pixel</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 12px' }}>Add this script before the closing &lt;/body&gt; tag:</p>
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
          <p style={{ color: '#64748b', fontSize: '12px', margin: '12px 0 0' }}>Your API Key: <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px', color: '#22d3ee' }}>b64b1ae188e43c8be236ae5ab4c3e4f84899349717f8a2c2c215dda814918403</code></p>
        </div>
      </main>
    </div>
  );
}
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
  page_url: string;
  timestamp: string;
  visitor_id: string;
  device_type: string;
  browser: string;
  os: string;
  referrer: string;
  utm_source: string;
  email: string;
  name: string;
}

interface BreakdownItem {
  name?: string;
  device_type?: string;
  page_path?: string;
  event_type?: string;
  source?: string;
  count: number | string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<BreakdownItem[]>([]);
  const [browserBreakdown, setBrowserBreakdown] = useState<BreakdownItem[]>([]);
  const [osBreakdown, setOsBreakdown] = useState<BreakdownItem[]>([]);
  const [topPages, setTopPages] = useState<BreakdownItem[]>([]);
  const [eventBreakdown, setEventBreakdown] = useState<BreakdownItem[]>([]);
  const [trafficSources, setTrafficSources] = useState<BreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStats(data.stats);
        setRecentEvents(data.recentEvents);
        setDeviceBreakdown(data.deviceBreakdown || []);
        setBrowserBreakdown(data.browserBreakdown || []);
        setOsBreakdown(data.osBreakdown || []);
        setTopPages(data.topPages || []);
        setEventBreakdown(data.eventBreakdown || []);
        setTrafficSources(data.trafficSources || []);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const dataTimer = setInterval(fetchData, 10000);
    const timeTimer = setInterval(() => setCurrentTime(new Date()), 1000);
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

  const getMaxCount = (items: BreakdownItem[]) => {
    return Math.max(...items.map(i => Number(i.count) || 0), 1);
  };

  const eventColors: Record<string, string> = {
    page_view: '#3b82f6',
    click: '#10b981',
    button_click: '#06b6d4',
    form_submit: '#8b5cf6',
    identify: '#f59e0b',
    page_leave: '#ef4444',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.95)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 700 }}>Boopin Data Platform</h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>1st Party Analytics Dashboard</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#e2e8f0', margin: 0, fontSize: '14px', fontWeight: 500 }}>{currentTime.toLocaleTimeString()}</p>
            <p style={{ color: '#22d3ee', margin: '2px 0 0', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', background: '#22d3ee', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
              Live • Updated {Math.round((currentTime.getTime() - lastUpdated.getTime()) / 1000)}s ago
            </p>
          </div>
        </div>
      </header>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Visitors', value: stats?.totalVisitors || 0, color: '#06b6d4', icon: '👥' },
            { label: 'Page Views', value: stats?.totalPageViews || 0, color: '#3b82f6', icon: '👁️' },
            { label: 'Total Events', value: stats?.totalEvents || 0, color: '#8b5cf6', icon: '⚡' },
            { label: 'Identified Users', value: stats?.identifiedVisitors || 0, color: '#10b981', icon: '✓', sub: `${conversionRate}% conversion` },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>{stat.label}</p>
                <span style={{ fontSize: '18px' }}>{stat.icon}</span>
              </div>
              <p style={{ color: '#fff', margin: 0, fontSize: '28px', fontWeight: 700 }}>{stat.value.toLocaleString()}</p>
              {stat.sub && <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '11px' }}>{stat.sub}</p>}
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Recent Events */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 600 }}>📊 Recent Events</h2>
              <span style={{ color: '#64748b', fontSize: '12px' }}>{recentEvents.length} events</span>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recentEvents.length === 0 ? (
                <p style={{ padding: '32px', textAlign: 'center', color: '#64748b', margin: 0 }}>No events yet</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0f172a' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>EVENT</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>DEVICE</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEvents.slice(0, 10).map((e) => (
                      <tr key={e.id} style={{ borderTop: '1px solid #334155' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: `${eventColors[e.event_type] || '#64748b'}20`, color: eventColors[e.event_type] || '#94a3b8', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{e.event_type}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{e.browser}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{e.os} • {e.device_type}</div>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px' }}>{formatDateTime(e.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Event Breakdown */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>⚡ Event Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {eventBreakdown.slice(0, 6).map((item, i) => {
                const type = item.event_type || 'unknown';
                const count = Number(item.count);
                const max = getMaxCount(eventBreakdown);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{type.replace('_', ' ')}</span>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{count}</span>
                    </div>
                    <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: eventColors[type] || '#64748b', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Three Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Browsers */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>🌐 Browsers</h2>
            {browserBreakdown.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {browserBreakdown.slice(0, 5).map((item, i) => {
                  const count = Number(item.count);
                  const max = getMaxCount(browserBreakdown);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{item.name}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: '#3b82f6', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Operating Systems */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>💻 Operating Systems</h2>
            {osBreakdown.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {osBreakdown.slice(0, 5).map((item, i) => {
                  const count = Number(item.count);
                  const max = getMaxCount(osBreakdown);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{item.name}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: '#8b5cf6', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Devices */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>📱 Devices</h2>
            {deviceBreakdown.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {deviceBreakdown.map((item, i) => {
                  const count = Number(item.count);
                  const max = getMaxCount(deviceBreakdown);
                  const deviceIcons: Record<string, string> = { desktop: '🖥️', mobile: '📱', tablet: '📟' };
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{deviceIcons[item.device_type || ''] || '❓'} {item.device_type}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: '#10b981', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Two Column - Pages & Sources */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Top Pages */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>📄 Top Pages</h2>
            {topPages.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topPages.map((item, i) => {
                  const count = Number(item.count);
                  const max = getMaxCount(topPages);
                  const path = item.page_path || '/';
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace' }}>{path.length > 30 ? path.slice(0, 30) + '...' : path}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: '#f59e0b', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Traffic Sources */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '18px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>🔗 Traffic Sources</h2>
            {trafficSources.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {trafficSources.map((item, i) => {
                  const count = Number(item.count);
                  const max = getMaxCount(trafficSources);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{item.source}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: '#ec4899', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Install Pixel */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '15px', color: '#fff', fontWeight: 600 }}>🔧 Install Tracking Pixel</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 12px' }}>Add this script before the closing &lt;/body&gt; tag:</p>
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
          <p style={{ color: '#64748b', fontSize: '12px', margin: '12px 0 0' }}>Your API Key: <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px', color: '#22d3ee' }}>b64b1ae188e43c8be236ae5ab4c3e4f84899349717f8a2c2c215dda814918403</code></p>
        </div>
      </main>
    </div>
  );
}
