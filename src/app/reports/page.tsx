'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';
import Navigation from '../../components/Navigation';

interface Stats {
  totalVisitors: number;
  totalPageViews: number;
  totalEvents: number;
  identifiedVisitors: number;
  formSubmits: number;
  purchases: number;
  addToCarts: number;
  cartAbandons: number;
  formStarts: number;
  signups: number;
  logins: number;
  deviceBreakdown: Array<{ device_type: string; count: number }>;
  topPages: Array<{ page_path: string; count: number }>;
  trafficSources: Array<{ source: string; count: number }>;
  countryBreakdown: Array<{ country: string; count: number }>;
}

interface Change {
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'neutral';
}

interface ReportData {
  mode: string;
  currentPeriod: {
    from: string;
    to: string;
    stats: Stats;
  };
  comparisonPeriod: {
    from: string;
    to: string;
    stats: Stats;
  };
  changes: {
    totalVisitors: Change;
    totalPageViews: Change;
    totalEvents: Change;
    identifiedVisitors: Change;
    formSubmits: Change;
    purchases: Change;
    addToCarts: Change;
    cartAbandons: Change;
    formStarts: Change;
    signups: Change;
    logins: Change;
  };
}

export default function ReportsPage() {
  const { selectedSite, loading: siteLoading } = useSite();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<string>('wow');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSite) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({
          mode,
          site_id: selectedSite.id
        });
        if (mode === 'custom' && customFrom && customTo) {
          params.append('from', customFrom);
          params.append('to', customTo);
        }
        const response = await fetch(`/api/reports?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mode !== 'custom' || (customFrom && customTo)) {
      fetchData();
    }
  }, [mode, customFrom, customTo, selectedSite]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➖';
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return '#10b981';
    if (trend === 'down') return '#ef4444';
    return '#64748b';
  };

  const MetricCard = ({
    label,
    currentValue,
    change,
    icon,
    color
  }: {
    label: string;
    currentValue: number;
    change: Change;
    icon: string;
    color: string;
  }) => (
    <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{label}</p>
          <p style={{ color: '#f8fafc', fontSize: '32px', fontWeight: 700, margin: '8px 0 0' }}>
            {currentValue.toLocaleString()}
          </p>
        </div>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '8px', background: '#0f172a', borderRadius: '6px' }}>
        <span style={{ fontSize: '16px' }}>{getTrendIcon(change.trend)}</span>
        <span style={{ color: getTrendColor(change.trend), fontSize: '14px', fontWeight: 600 }}>
          {change.percentage > 0 ? '+' : ''}{change.percentage}%
        </span>
        <span style={{ color: '#64748b', fontSize: '12px' }}>
          ({change.value > 0 ? '+' : ''}{change.value})
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#e2e8f0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p>Loading reports...</p>
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
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Comparison Reports</p>
              </div>
            </Link>
          </div>
          <Navigation />
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: 700 }}>📊 Comparison Reports</h2>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Analyze trends and compare performance across different time periods
          </p>
        </div>

        {/* Comparison Mode Selector */}
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', color: '#f8fafc', fontSize: '16px', fontWeight: 600 }}>
            Comparison Mode
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: mode === 'custom' ? '16px' : 0 }}>
            {[
              { key: 'wow', label: 'Week over Week', icon: '📅' },
              { key: 'mom', label: 'Month over Month', icon: '🗓️' },
              { key: 'qoq', label: 'Quarter over Quarter', icon: '📆' },
              { key: 'yoy', label: 'Year over Year', icon: '🗒️' },
              { key: 'custom', label: 'Custom Range', icon: '⚙️' }
            ].map(option => (
              <button
                key={option.key}
                onClick={() => setMode(option.key)}
                style={{
                  background: mode === option.key ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Inputs */}
          {mode === 'custom' && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px', padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>From Date</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>To Date</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {data && (
          <>
            {/* Period Summary */}
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#22d3ee', fontSize: '12px', margin: 0, fontWeight: 600 }}>CURRENT PERIOD</p>
                  <p style={{ color: '#f8fafc', fontSize: '18px', margin: '8px 0 0', fontWeight: 600 }}>
                    {formatDate(data.currentPeriod.from)} - {formatDate(data.currentPeriod.to)}
                  </p>
                </div>
                <div style={{ fontSize: '32px' }}>⚡</div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: 0, fontWeight: 600 }}>COMPARISON PERIOD</p>
                  <p style={{ color: '#94a3b8', fontSize: '18px', margin: '8px 0 0', fontWeight: 600 }}>
                    {formatDate(data.comparisonPeriod.from)} - {formatDate(data.comparisonPeriod.to)}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#f8fafc', fontSize: '18px', margin: '0 0 16px', fontWeight: 600 }}>
                📊 Key Metrics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <MetricCard
                  label="Total Visitors"
                  currentValue={data.currentPeriod.stats.totalVisitors}
                  change={data.changes.totalVisitors}
                  icon="👥"
                  color="#3b82f6"
                />
                <MetricCard
                  label="Page Views"
                  currentValue={data.currentPeriod.stats.totalPageViews}
                  change={data.changes.totalPageViews}
                  icon="👁️"
                  color="#10b981"
                />
                <MetricCard
                  label="Total Events"
                  currentValue={data.currentPeriod.stats.totalEvents}
                  change={data.changes.totalEvents}
                  icon="⚡"
                  color="#f59e0b"
                />
                <MetricCard
                  label="Identified Users"
                  currentValue={data.currentPeriod.stats.identifiedVisitors}
                  change={data.changes.identifiedVisitors}
                  icon="👤"
                  color="#8b5cf6"
                />
              </div>
            </div>

            {/* E-commerce Metrics */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#f8fafc', fontSize: '18px', margin: '0 0 16px', fontWeight: 600 }}>
                🛒 E-commerce Performance
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <MetricCard
                  label="Purchases"
                  currentValue={data.currentPeriod.stats.purchases}
                  change={data.changes.purchases}
                  icon="✅"
                  color="#10b981"
                />
                <MetricCard
                  label="Add to Cart"
                  currentValue={data.currentPeriod.stats.addToCarts}
                  change={data.changes.addToCarts}
                  icon="🛒"
                  color="#22c55e"
                />
                <MetricCard
                  label="Cart Abandons"
                  currentValue={data.currentPeriod.stats.cartAbandons}
                  change={data.changes.cartAbandons}
                  icon="🛒"
                  color="#ef4444"
                />
              </div>
            </div>

            {/* Engagement Metrics */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#f8fafc', fontSize: '18px', margin: '0 0 16px', fontWeight: 600 }}>
                📝 Engagement Metrics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <MetricCard
                  label="Form Starts"
                  currentValue={data.currentPeriod.stats.formStarts}
                  change={data.changes.formStarts}
                  icon="✏️"
                  color="#14b8a6"
                />
                <MetricCard
                  label="Form Submits"
                  currentValue={data.currentPeriod.stats.formSubmits}
                  change={data.changes.formSubmits}
                  icon="📝"
                  color="#8b5cf6"
                />
                <MetricCard
                  label="Sign Ups"
                  currentValue={data.currentPeriod.stats.signups}
                  change={data.changes.signups}
                  icon="🆕"
                  color="#10b981"
                />
                <MetricCard
                  label="Logins"
                  currentValue={data.currentPeriod.stats.logins}
                  change={data.changes.logins}
                  icon="🔑"
                  color="#3b82f6"
                />
              </div>
            </div>

            {/* Detailed Breakdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Top Pages Comparison */}
              <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
                <h3 style={{ color: '#f8fafc', fontSize: '16px', margin: '0 0 16px', fontWeight: 600 }}>
                  📄 Top Pages
                </h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#22d3ee', fontSize: '12px', margin: '0 0 12px', fontWeight: 600 }}>CURRENT</p>
                    {data.currentPeriod.stats.topPages.slice(0, 5).map((page, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.page_path}</span>
                        <span style={{ color: '#22d3ee', fontSize: '12px', fontWeight: 600, marginLeft: '8px' }}>{page.count}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 12px', fontWeight: 600 }}>PREVIOUS</p>
                    {data.comparisonPeriod.stats.topPages.slice(0, 5).map((page, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                        <span style={{ color: '#94a3b8', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.page_path}</span>
                        <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, marginLeft: '8px' }}>{page.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Traffic Sources Comparison */}
              <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
                <h3 style={{ color: '#f8fafc', fontSize: '16px', margin: '0 0 16px', fontWeight: 600 }}>
                  🔗 Traffic Sources
                </h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#22d3ee', fontSize: '12px', margin: '0 0 12px', fontWeight: 600 }}>CURRENT</p>
                    {data.currentPeriod.stats.trafficSources.slice(0, 5).map((source, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{source.source}</span>
                        <span style={{ color: '#22d3ee', fontSize: '12px', fontWeight: 600 }}>{source.count}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 12px', fontWeight: 600 }}>PREVIOUS</p>
                    {data.comparisonPeriod.stats.trafficSources.slice(0, 5).map((source, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{source.source}</span>
                        <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>{source.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
