'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../../contexts/SiteContext';
import Navigation from '../../../components/Navigation';
import Logo from '../../../components/Logo';
import SiteSelector from '../../../components/SiteSelector';

interface ReportFilters {
  date_from: string;
  date_to: string;
  source: string;
  medium: string;
  campaign: string;
  country: string;
  device_type: string;
  event_type: string;
}

export default function AdvancedReportsPage() {
  const { selectedSite, loading: siteLoading } = useSite();
  const [reportType, setReportType] = useState('traffic_sources');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Comparison states
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [comparisonFilters, setComparisonFilters] = useState<ReportFilters>({
    date_from: '',
    date_to: '',
    source: '',
    medium: '',
    campaign: '',
    country: '',
    device_type: '',
    event_type: ''
  });

  // Filter states
  const [filters, setFilters] = useState<ReportFilters>({
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    date_to: new Date().toISOString().split('T')[0],
    source: '',
    medium: '',
    campaign: '',
    country: '',
    device_type: '',
    event_type: ''
  });

  // Available event types for dropdown
  const [eventTypes, setEventTypes] = useState<string[]>([]);

  // Check URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sourceParam = params.get('source');
    const viewParam = params.get('view');

    if (sourceParam && viewParam === 'entry_exit') {
      // User clicked from dashboard - show entry/exit pages
      setSelectedSource(sourceParam);
      setReportType('entry_exit_by_source');
      setFilters(prev => ({ ...prev, source: sourceParam }));
    }
  }, []);

  useEffect(() => {
    if (selectedSite) {
      // Fetch available event types
      fetch(`/api/events/types?site_id=${selectedSite.id}`)
        .then(res => res.json())
        .then(types => setEventTypes(types))
        .catch(console.error);
    }
  }, [selectedSite]);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedSite]);

  const fetchReport = async () => {
    if (!selectedSite) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        site_id: selectedSite.id,
        report_type: reportType,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      });

      const response = await fetch(`/api/reports/advanced?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      const result = await response.json();
      setReportData(result);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonData = async () => {
    if (!selectedSite || !comparisonFilters.date_from || !comparisonFilters.date_to) return;

    try {
      const params = new URLSearchParams({
        site_id: selectedSite.id,
        report_type: reportType,
        ...Object.fromEntries(
          Object.entries(comparisonFilters).filter(([_, v]) => v !== '')
        )
      });

      const response = await fetch(`/api/reports/advanced?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch comparison data');
      const result = await response.json();
      setComparisonData(result);
    } catch (error) {
      console.error('Failed to fetch comparison data:', error);
    }
  };

  const handleSourceClick = (source: string) => {
    setSelectedSource(source);
    setReportType('entry_exit_by_source');
    setFilters({ ...filters, source });
  };

  const handleBackToSources = () => {
    setSelectedSource(null);
    setReportType('traffic_sources');
    setFilters({ ...filters, source: '' });
    setComparisonMode(false);
    setComparisonData(null);
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.data) return;

    let csvContent = '';
    const data = reportData.data;

    if (reportType === 'entry_exit_by_source') {
      const entryPages = data.entryPages || [];
      const exitPages = data.exitPages || [];
      csvContent = [
        ['Type', 'Page URL', 'Source', 'Sessions'].join(','),
        ...entryPages.map((row: any) => ['Entry', row.page_url, row.source, row.sessions].join(',')),
        ...exitPages.map((row: any) => ['Exit', row.page_url, row.source, row.sessions].join(','))
      ].join('\n');
    } else if (reportType === 'traffic_sources' && Array.isArray(data)) {
      csvContent = [
        ['Source', 'Medium', 'Campaign', 'Unique Visitors', 'Sessions', 'Pageviews', 'Conversions', 'Conversion Rate', 'Avg Session Duration'].join(','),
        ...data.map((row: any) => [
          row.source,
          row.medium,
          row.campaign,
          row.unique_visitors,
          row.sessions,
          row.pageviews,
          row.conversions,
          row.conversion_rate,
          row.avg_session_duration
        ].join(','))
      ].join('\n');
    } else if (reportType === 'conversions' && Array.isArray(data)) {
      csvContent = [
        ['Event Type', 'Source', 'Medium', 'Conversion Count', 'Unique Converters', 'Converting Sessions', 'Date'].join(','),
        ...data.map((row: any) => [
          row.event_type,
          row.source,
          row.medium,
          row.conversion_count,
          row.unique_converters,
          row.converting_sessions,
          row.conversion_date
        ].join(','))
      ].join('\n');
    } else if (reportType === 'geographic' && Array.isArray(data)) {
      csvContent = [
        ['Country', 'City', 'Unique Visitors', 'Sessions', 'Events', 'Conversions', 'Conversion Rate'].join(','),
        ...data.map((row: any) => [
          row.country,
          row.city,
          row.unique_visitors,
          row.sessions,
          row.total_events,
          row.conversions,
          row.conversion_rate
        ].join(','))
      ].join('\n');
    } else if (reportType === 'devices' && Array.isArray(data)) {
      csvContent = [
        ['Device Type', 'Browser', 'OS', 'Unique Visitors', 'Sessions', 'Events', 'Conversions', 'Conversion Rate'].join(','),
        ...data.map((row: any) => [
          row.device_type,
          row.browser,
          row.os,
          row.unique_visitors,
          row.sessions,
          row.total_events,
          row.conversions,
          row.conversion_rate
        ].join(','))
      ].join('\n');
    } else if (reportType === 'forms' && Array.isArray(data)) {
      csvContent = [
        ['Form Page', 'Source', 'Medium', 'Form Starts', 'Form Submits', 'Completion Rate'].join(','),
        ...data.map((row: any) => [
          row.form_page,
          row.source,
          row.medium,
          row.form_starts,
          row.form_submits,
          row.completion_rate + '%'
        ].join(','))
      ].join('\n');
    } else if (reportType === 'overview') {
      csvContent = [
        ['Metric', 'Value'].join(','),
        ['Total Visitors', data.total_visitors || 0].join(','),
        ['Total Sessions', data.total_sessions || 0].join(','),
        ['Total Events', data.total_events || 0].join(','),
        ['Total Pageviews', data.total_pageviews || 0].join(','),
        ['Total Conversions', data.total_conversions || 0].join(','),
        ['Total Form Starts', data.total_form_starts || 0].join(','),
        ['Total Form Submits', data.total_form_submits || 0].join(','),
        ['Conversion Rate', (data.conversion_rate || 0) + '%'].join(','),
        ['Form Completion Rate', (data.form_completion_rate || 0) + '%'].join(','),
        ['Avg Pageviews/Session', data.avg_pageviews_per_session || 0].join(','),
        ['Avg Session Duration', (data.avg_session_duration || 0) + 's'].join(','),
        ['Bounce Rate', (data.bounce_rate || 0) + '%'].join(',')
      ].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p>Loading report...</p>
        </div>
      );
    }

    if (!reportData || !reportData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p>No data available</p>
        </div>
      );
    }

    const data = reportData.data;

    switch (reportType) {
      case 'traffic_sources':
        return (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
              🔗 Traffic Sources
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
              💡 Click any source to view entry and exit pages for that traffic source
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Source</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Medium</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Campaign</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Visitors</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Sessions</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Pageviews</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Conversions</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Conv. Rate</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Avg Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(data) && data.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleSourceClick(row.source)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '13px',
                            padding: 0
                          }}
                        >
                          {row.source} →
                        </button>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.medium}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.campaign}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#1e293b' }}>{parseInt(row.unique_visitors).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{parseInt(row.sessions).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{parseInt(row.pageviews).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#2563eb', fontWeight: 500 }}>{parseInt(row.conversions).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: row.conversion_rate > 5 ? '#10b981' : '#64748b' }}>{row.conversion_rate}%</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{parseInt(row.avg_session_duration || 0)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'conversions':
        return (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
              ✅ Conversions
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Event Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Source</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Medium</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Count</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Unique</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(data) && data.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#64748b' }}>{new Date(row.conversion_date).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', color: '#1e293b', fontWeight: 500 }}>{row.event_type}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.source}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.medium}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#2563eb', fontWeight: 500 }}>{parseInt(row.conversion_count).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{parseInt(row.unique_converters).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{parseInt(row.converting_sessions).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'geographic':
        return (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
              🌍 Geographic Distribution
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Country</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>City</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Visitors</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Sessions</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Events</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Conversions</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(data) && data.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#1e293b', fontWeight: 500 }}>{row.country}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.city}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#1e293b' }}>{parseInt(row.unique_visitors).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{parseInt(row.sessions).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{parseInt(row.total_events).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#2563eb', fontWeight: 500 }}>{parseInt(row.conversions).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: row.conversion_rate > 5 ? '#10b981' : '#64748b' }}>{row.conversion_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'devices':
        return (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
              📱 Device & Browser Breakdown
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Device</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Browser</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>OS</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Visitors</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Sessions</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Events</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Conversions</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(data) && data.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#1e293b', fontWeight: 500 }}>{row.device_type}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.browser}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.os}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#1e293b' }}>{parseInt(row.unique_visitors).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{parseInt(row.sessions).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{parseInt(row.total_events).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#2563eb', fontWeight: 500 }}>{parseInt(row.conversions).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: row.conversion_rate > 5 ? '#10b981' : '#64748b' }}>{row.conversion_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'forms':
        return (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
              📝 Forms Performance
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Form Page</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Source</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Medium</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Form Starts</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Form Submits</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(data) && data.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#1e293b', fontWeight: 500, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.form_page}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.source}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.medium}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#2563eb', fontWeight: 500 }}>{parseInt(row.form_starts || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 500 }}>{parseInt(row.form_submits || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: row.completion_rate > 50 ? '#10b981' : row.completion_rate > 25 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{parseFloat(row.completion_rate || 0).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'entry_exit_by_source':
        const entryPages = data?.entryPages || [];
        const exitPages = data?.exitPages || [];
        const compEntryPages = comparisonData?.data?.entryPages || [];
        const compExitPages = comparisonData?.data?.exitPages || [];
        const debugInfo = data?.debug;

        return (
          <div>
            {/* Debug Info - Show if no data */}
            {entryPages.length === 0 && exitPages.length === 0 && debugInfo && (
              <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#92400e' }}>
                  ⚠️ No Data Found - Debug Information
                </h3>
                <div style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.6' }}>
                  <p style={{ margin: '8px 0' }}><strong>Total Events:</strong> {debugInfo.total_events || 0}</p>
                  <p style={{ margin: '8px 0' }}><strong>Pageview Events:</strong> {debugInfo.pageview_events || 0}</p>
                  <p style={{ margin: '8px 0' }}><strong>Events with URL:</strong> {debugInfo.events_with_url || 0}</p>
                  <p style={{ margin: '8px 0' }}><strong>Pageviews with URL:</strong> {debugInfo.pageview_with_url || 0}</p>
                  <p style={{ margin: '8px 0' }}><strong>Total Sessions:</strong> {debugInfo.total_sessions || 0}</p>
                  <p style={{ margin: '8px 0' }}><strong>Event Types Found:</strong> {debugInfo.event_types ? debugInfo.event_types.join(', ') : 'None'}</p>
                  <p style={{ margin: '8px 0' }}><strong>Sources Found:</strong> {debugInfo.sources ? debugInfo.sources.join(', ') : 'None'}</p>
                  <p style={{ margin: '12px 0 0', padding: '12px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fcd34d' }}>
                    <strong>Possible Issues:</strong><br/>
                    • Make sure you have tracking code installed on your website<br/>
                    • Verify pageview events are being sent with <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>window.boopin.track('pageview')</code><br/>
                    • Check that the date range includes events for source "{selectedSource}"
                  </p>
                </div>
              </div>
            )}

            {/* Back Button & Comparison Controls */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button
                  onClick={handleBackToSources}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                >
                  ← Back to Traffic Sources
                </button>
                <button
                  onClick={() => {
                    setComparisonMode(!comparisonMode);
                    if (comparisonMode) {
                      setComparisonData(null);
                      setComparisonFilters({
                        date_from: '',
                        date_to: '',
                        source: '',
                        medium: '',
                        campaign: '',
                        country: '',
                        device_type: '',
                        event_type: ''
                      });
                    }
                  }}
                  style={{
                    background: comparisonMode ? '#ef4444' : '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#ffffff'
                  }}
                >
                  {comparisonMode ? '✕ Cancel Comparison' : '📊 Compare Dates'}
                </button>
              </div>

              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
                Entry & Exit Pages for "{selectedSource}"
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Period: {new Date(filters.date_from || '').toLocaleDateString()} - {new Date(filters.date_to || '').toLocaleDateString()}
              </p>

              {/* Comparison Date Picker */}
              {comparisonMode && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                    Compare with another date range:
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                    <div>
                      <label style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '6px' }}>From Date</label>
                      <input
                        type="date"
                        value={comparisonFilters.date_from}
                        onChange={(e) => setComparisonFilters({ ...comparisonFilters, date_from: e.target.value, source: selectedSource || '' })}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '6px' }}>To Date</label>
                      <input
                        type="date"
                        value={comparisonFilters.date_to}
                        onChange={(e) => setComparisonFilters({ ...comparisonFilters, date_to: e.target.value, source: selectedSource || '' })}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                    <button
                      onClick={fetchComparisonData}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Compare
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Entry Pages */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
                🚪 Entry Pages
                {comparisonMode && comparisonData && (
                  <span style={{ fontSize: '13px', fontWeight: 400, color: '#64748b', marginLeft: '12px' }}>
                    (Comparing with {new Date(comparisonFilters.date_from || '').toLocaleDateString()} - {new Date(comparisonFilters.date_to || '').toLocaleDateString()})
                  </span>
                )}
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Page URL</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Sessions</th>
                      {comparisonMode && comparisonData && (
                        <>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Comparison Sessions</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Change</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {entryPages.map((row: any, i: number) => {
                      const compRow = compEntryPages.find((c: any) => c.page_url === row.page_url);
                      const change = compRow ? ((parseInt(row.sessions) - parseInt(compRow.sessions)) / parseInt(compRow.sessions) * 100).toFixed(1) : null;

                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', color: '#1e293b', fontWeight: 500, maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.page_url}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#2563eb', fontWeight: 600 }}>{parseInt(row.sessions).toLocaleString()}</td>
                          {comparisonMode && comparisonData && (
                            <>
                              <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>
                                {compRow ? parseInt(compRow.sessions).toLocaleString() : '-'}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: change && parseFloat(change) > 0 ? '#10b981' : change && parseFloat(change) < 0 ? '#ef4444' : '#64748b' }}>
                                {change ? `${parseFloat(change) > 0 ? '+' : ''}${change}%` : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exit Pages */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
                🚪 Exit Pages
                {comparisonMode && comparisonData && (
                  <span style={{ fontSize: '13px', fontWeight: 400, color: '#64748b', marginLeft: '12px' }}>
                    (Comparing with {new Date(comparisonFilters.date_from || '').toLocaleDateString()} - {new Date(comparisonFilters.date_to || '').toLocaleDateString()})
                  </span>
                )}
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Page URL</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Sessions</th>
                      {comparisonMode && comparisonData && (
                        <>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Comparison Sessions</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Change</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {exitPages.map((row: any, i: number) => {
                      const compRow = compExitPages.find((c: any) => c.page_url === row.page_url);
                      const change = compRow ? ((parseInt(row.sessions) - parseInt(compRow.sessions)) / parseInt(compRow.sessions) * 100).toFixed(1) : null;

                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', color: '#1e293b', fontWeight: 500, maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.page_url}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>{parseInt(row.sessions).toLocaleString()}</td>
                          {comparisonMode && comparisonData && (
                            <>
                              <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>
                                {compRow ? parseInt(compRow.sessions).toLocaleString() : '-'}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: change && parseFloat(change) > 0 ? '#10b981' : change && parseFloat(change) < 0 ? '#ef4444' : '#64748b' }}>
                                {change ? `${parseFloat(change) > 0 ? '+' : ''}${change}%` : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'overview':
        return (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
              📊 Overview Metrics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Total Visitors</p>
                <p style={{ color: '#1e293b', fontSize: '24px', fontWeight: 700, margin: '8px 0 0' }}>
                  {parseInt(data.total_visitors || 0).toLocaleString()}
                </p>
              </div>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Total Sessions</p>
                <p style={{ color: '#1e293b', fontSize: '24px', fontWeight: 700, margin: '8px 0 0' }}>
                  {parseInt(data.total_sessions || 0).toLocaleString()}
                </p>
              </div>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Total Pageviews</p>
                <p style={{ color: '#1e293b', fontSize: '24px', fontWeight: 700, margin: '8px 0 0' }}>
                  {parseInt(data.total_pageviews || 0).toLocaleString()}
                </p>
              </div>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Total Conversions</p>
                <p style={{ color: '#2563eb', fontSize: '24px', fontWeight: 700, margin: '8px 0 0' }}>
                  {parseInt(data.total_conversions || 0).toLocaleString()}
                </p>
              </div>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Form Starts</p>
                <p style={{ color: '#2563eb', fontSize: '24px', fontWeight: 700, margin: '8px 0 0' }}>
                  {parseInt(data.total_form_starts || 0).toLocaleString()}
                </p>
              </div>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Form Submits</p>
                <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 700, margin: '8px 0 0' }}>
                  {parseInt(data.total_form_submits || 0).toLocaleString()}
                </p>
              </div>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Conversion Rate</p>
                <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 700, margin: '8px 0 0' }}>
                  {parseFloat(data.conversion_rate || 0).toFixed(2)}%
                </p>
              </div>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Form Completion Rate</p>
                <p style={{ color: '#8b5cf6', fontSize: '24px', fontWeight: 700, margin: '8px 0 0' }}>
                  {parseFloat(data.form_completion_rate || 0).toFixed(2)}%
                </p>
              </div>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Bounce Rate</p>
                <p style={{ color: '#ef4444', fontSize: '24px', fontWeight: 700, margin: '8px 0 0' }}>
                  {parseFloat(data.bounce_rate || 0).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Link href="/reports" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>
                ← Back to Comparison Reports
              </Link>
            </div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: 700 }}>📈 Advanced Reports</h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
              Deep dive into your data with advanced filtering and segmentation
            </p>
          </div>
          {reportData && (
            <button
              onClick={exportToCSV}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              📊 Export CSV
            </button>
          )}
        </div>

        {/* Report Type Selector */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Report Type</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'traffic_sources', label: 'Traffic Sources', icon: '🔗' },
              { key: 'conversions', label: 'Conversions', icon: '✅' },
              { key: 'forms', label: 'Forms', icon: '📝' },
              { key: 'geographic', label: 'Geographic', icon: '🌍' },
              { key: 'devices', label: 'Devices', icon: '📱' }
            ].map(type => (
              <button
                key={type.key}
                onClick={() => setReportType(type.key)}
                style={{
                  background: reportType === type.key ? '#2563eb' : '#ffffff',
                  color: reportType === type.key ? '#ffffff' : '#475569',
                  border: `1px solid ${reportType === type.key ? '#2563eb' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '6px' }}>From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '6px' }}>To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Source</label>
              <input
                type="text"
                placeholder="e.g., google, facebook"
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Medium</label>
              <input
                type="text"
                placeholder="e.g., cpc, email"
                value={filters.medium}
                onChange={(e) => setFilters({ ...filters, medium: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Campaign</label>
              <input
                type="text"
                placeholder="Campaign name"
                value={filters.campaign}
                onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Event Type</label>
              <input
                type="text"
                placeholder="e.g., purchase, signup"
                value={filters.event_type}
                onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={fetchReport}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setFilters({
                  date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  date_to: new Date().toISOString().split('T')[0],
                  source: '',
                  medium: '',
                  campaign: '',
                  country: '',
                  device_type: '',
                  event_type: ''
                });
                setTimeout(fetchReport, 100);
              }}
              style={{
                background: '#ffffff',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Report Content */}
        {renderReportContent()}
      </main>
    </div>
  );
}
