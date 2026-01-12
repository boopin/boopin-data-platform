'use client';
import Logo from '../../components/Logo';
import SiteSelector from '../../components/SiteSelector';

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
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading errors...</p>
      </div>
    );
  }

  if (!selectedSite) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>No site selected. Please select a site from the dashboard.</p>
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
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: 700 }}>🐛 JavaScript Errors</h2>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
            {groupedErrors.length} unique errors tracked
          </p>
        </div>

        {/* Errors List */}
        {groupedErrors.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '80px 20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <p style={{ color: '#1e293b', fontSize: '18px', fontWeight: 600, margin: 0 }}>No errors detected</p>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '8px 0 0' }}>
              Your site is running smoothly!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {groupedErrors.map((error, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
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
                      color: '#1e293b',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {error.message}
                    </h3>

                    <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '13px' }}>
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
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
                          Stack Trace:
                        </p>
                        <pre
                          style={{
                            margin: 0,
                            fontSize: '11px',
                            color: '#1e293b',
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
