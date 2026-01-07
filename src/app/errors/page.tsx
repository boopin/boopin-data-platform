'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';
import Navigation from '../../components/Navigation';

interface ErrorEvent {
  id: string;
  message: string;
  error_type: string;
  filename: string;
  lineno: number;
  colno: number;
  stack: string;
  page_url: string;
  page_path: string;
  user_agent: string;
  timestamp: string;
  device_type: string;
  browser: string;
  os: string;
  country: string;
  visitor_id: string;
}

interface GroupedError {
  message: string;
  error_type: string;
  filename: string;
  lineno: number;
  count: number;
  first_seen: string;
  last_seen: string;
  affected_users_count: number;
  stack: string;
}

export default function ErrorsPage() {
  const { selectedSite, loading: siteLoading } = useSite();
  const [groupedErrors, setGroupedErrors] = useState<GroupedError[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<GroupedError | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'timeline'>('grouped');

  useEffect(() => {
    const fetchErrors = async () => {
      if (!selectedSite) return;

      try {
        const res = await fetch(`/api/errors?site_id=${selectedSite.id}`);
        const data = await res.json();
        setGroupedErrors(data.groupedErrors || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchErrors();
  }, [selectedSite]);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (count: number) => {
    if (count >= 100) return '#ef4444'; // red
    if (count >= 50) return '#f97316'; // orange
    if (count >= 10) return '#f59e0b'; // yellow
    return '#10b981'; // green
  };

  if (siteLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading errors...</p>
      </div>
    );
  }

  if (!selectedSite) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>No site selected. Please select a site from the dashboard.</p>
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
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Error Tracking</p>
              </div>
            </Link>
          </div>
          <Navigation />
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: 700 }}>🐛 JavaScript Errors</h2>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            {groupedErrors.length} unique errors tracked
          </p>
        </div>

        {/* Errors List */}
        {groupedErrors.length === 0 ? (
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '80px 20px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <p style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 600, margin: 0 }}>No errors detected</p>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '8px 0 0' }}>
              Your site is running smoothly!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {groupedErrors.map((error, idx) => (
              <div
                key={idx}
                style={{
                  background: '#1e293b',
                  borderRadius: '12px',
                  border: '1px solid #334155',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedError(selectedError?.message === error.message ? null : error)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Severity Badge */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: getSeverityColor(error.count) + '20',
                      border: `2px solid ${getSeverityColor(error.count)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: getSeverityColor(error.count),
                      flexShrink: 0
                    }}
                  >
                    {error.count}
                  </div>

                  {/* Error Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span
                        style={{
                          background: '#ef444420',
                          color: '#ef4444',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        {error.error_type}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>
                        {error.affected_users_count} affected user{error.affected_users_count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <h3 style={{
                      margin: '0 0 8px',
                      fontSize: '16px',
                      color: '#f8fafc',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {error.message}
                    </h3>

                    <div style={{ display: 'flex', gap: '16px', color: '#94a3b8', fontSize: '13px' }}>
                      <span>{error.filename}:{error.lineno}</span>
                      <span>First: {formatDate(error.first_seen)}</span>
                      <span>Last: {formatDate(error.last_seen)}</span>
                    </div>

                    {/* Stack Trace (expanded) */}
                    {selectedError?.message === error.message && error.stack && (
                      <div
                        style={{
                          marginTop: '16px',
                          padding: '16px',
                          background: '#0f172a',
                          borderRadius: '8px',
                          border: '1px solid #334155'
                        }}
                      >
                        <p style={{ margin: '0 0 8px', color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>
                          Stack Trace:
                        </p>
                        <pre
                          style={{
                            margin: 0,
                            fontSize: '11px',
                            color: '#e2e8f0',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            lineHeight: 1.5
                          }}
                        >
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
