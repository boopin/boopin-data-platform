'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';
import Navigation from '../../components/Navigation';
import Logo from '../../components/Logo';
import SiteSelector from '../../components/SiteSelector';

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

  const exportToCSV = () => {
    if (!data) return;

    const headers = ['Metric', 'Current Period', 'Previous Period', 'Change', 'Change %'];
    const metrics = [
      ['Total Visitors', data.currentPeriod.stats.totalVisitors, data.comparisonPeriod.stats.totalVisitors, data.changes.totalVisitors.value, data.changes.totalVisitors.percentage],
      ['Page Views', data.currentPeriod.stats.totalPageViews, data.comparisonPeriod.stats.totalPageViews, data.changes.totalPageViews.value, data.changes.totalPageViews.percentage],
      ['Total Events', data.currentPeriod.stats.totalEvents, data.comparisonPeriod.stats.totalEvents, data.changes.totalEvents.value, data.changes.totalEvents.percentage],
      ['Identified Users', data.currentPeriod.stats.identifiedVisitors, data.comparisonPeriod.stats.identifiedVisitors, data.changes.identifiedVisitors.value, data.changes.identifiedVisitors.percentage],
      ['Purchases', data.currentPeriod.stats.purchases, data.comparisonPeriod.stats.purchases, data.changes.purchases.value, data.changes.purchases.percentage],
      ['Add to Cart', data.currentPeriod.stats.addToCarts, data.comparisonPeriod.stats.addToCarts, data.changes.addToCarts.value, data.changes.addToCarts.percentage],
      ['Cart Abandons', data.currentPeriod.stats.cartAbandons, data.comparisonPeriod.stats.cartAbandons, data.changes.cartAbandons.value, data.changes.cartAbandons.percentage],
      ['Form Starts', data.currentPeriod.stats.formStarts, data.comparisonPeriod.stats.formStarts, data.changes.formStarts.value, data.changes.formStarts.percentage],
      ['Form Submits', data.currentPeriod.stats.formSubmits, data.comparisonPeriod.stats.formSubmits, data.changes.formSubmits.value, data.changes.formSubmits.percentage],
      ['Sign Ups', data.currentPeriod.stats.signups, data.comparisonPeriod.stats.signups, data.changes.signups.value, data.changes.signups.percentage],
      ['Logins', data.currentPeriod.stats.logins, data.comparisonPeriod.stats.logins, data.changes.logins.value, data.changes.logins.percentage]
    ];

    const csvContent = [
      headers.join(','),
      ...metrics.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${mode}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${mode}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
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
    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontWeight: 500 }}>{label}</p>
          <p style={{ color: '#1e293b', fontSize: '32px', fontWeight: 700, margin: '8px 0 0' }}>
            {currentValue.toLocaleString()}
          </p>
        </div>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
        <span style={{ fontSize: '16px' }}>{getTrendIcon(change.trend)}</span>
        <span style={{ color: getTrendColor(change.trend), fontSize: '14px', fontWeight: 500 }}>
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
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p>Loading reports...</p>
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
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: 700 }}>📊 Comparison Reports</h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
              Analyze trends and compare performance across different time periods
            </p>
          </div>
          {data && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={exportToCSV}
                style={{
                  background: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📊 Export CSV
              </button>
              <button
                onClick={exportToJSON}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📦 Export JSON
              </button>
            </div>
          )}
        </div>

        {/* Comparison Mode Selector */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1e293b', fontSize: '16px', fontWeight: 500 }}>
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
                  background: mode === option.key ? '#2563eb' : '#ffffff',
                  color: mode === option.key ? '#ffffff' : '#475569',
                  border: `1px solid ${mode === option.key ? '#2563eb' : '#e2e8f0'}`,
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
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '6px' }}>From Date</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#1e293b',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '6px' }}>To Date</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#1e293b',
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
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#2563eb', fontSize: '12px', margin: 0, fontWeight: 500 }}>CURRENT PERIOD</p>
                  <p style={{ color: '#1e293b', fontSize: '18px', margin: '8px 0 0', fontWeight: 500 }}>
                    {formatDate(data.currentPeriod.from)} - {formatDate(data.currentPeriod.to)}
                  </p>
                </div>
                <div style={{ fontSize: '32px' }}>⚡</div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: 0, fontWeight: 500 }}>COMPARISON PERIOD</p>
                  <p style={{ color: '#64748b', fontSize: '18px', margin: '8px 0 0', fontWeight: 500 }}>
                    {formatDate(data.comparisonPeriod.from)} - {formatDate(data.comparisonPeriod.to)}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#1e293b', fontSize: '18px', margin: '0 0 16px', fontWeight: 600 }}>
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
              <h3 style={{ color: '#1e293b', fontSize: '18px', margin: '0 0 16px', fontWeight: 600 }}>
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
              <h3 style={{ color: '#1e293b', fontSize: '18px', margin: '0 0 16px', fontWeight: 600 }}>
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
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ color: '#1e293b', fontSize: '16px', margin: '0 0 16px', fontWeight: 600 }}>
                  📄 Top Pages
                </h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#2563eb', fontSize: '12px', margin: '0 0 12px', fontWeight: 500 }}>CURRENT</p>
                    {data.currentPeriod.stats.topPages.slice(0, 5).map((page, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#1e293b', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.page_path}</span>
                        <span style={{ color: '#2563eb', fontSize: '12px', fontWeight: 500, marginLeft: '8px' }}>{page.count}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 12px', fontWeight: 500 }}>PREVIOUS</p>
                    {data.comparisonPeriod.stats.topPages.slice(0, 5).map((page, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#64748b', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.page_path}</span>
                        <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500, marginLeft: '8px' }}>{page.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Traffic Sources Comparison */}
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ color: '#1e293b', fontSize: '16px', margin: '0 0 16px', fontWeight: 600 }}>
                  🔗 Traffic Sources
                </h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#2563eb', fontSize: '12px', margin: '0 0 12px', fontWeight: 500 }}>CURRENT</p>
                    {data.currentPeriod.stats.trafficSources.slice(0, 5).map((source, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#1e293b', fontSize: '12px' }}>{source.source}</span>
                        <span style={{ color: '#2563eb', fontSize: '12px', fontWeight: 500 }}>{source.count}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 12px', fontWeight: 500 }}>PREVIOUS</p>
                    {data.comparisonPeriod.stats.trafficSources.slice(0, 5).map((source, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>{source.source}</span>
                        <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>{source.count}</span>
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
