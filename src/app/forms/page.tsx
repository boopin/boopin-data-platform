'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';

interface FormStat {
  form_id: string;
  form_name: string;
  starts: number;
  submits: number;
  abandons: number;
  conversionRate: number;
  abandonRate: number;
  avgTimeToComplete: number;
  avgFieldsAbandoned: number;
  uniqueVisitors: number;
}

interface FormsData {
  forms: FormStat[];
  stats: {
    totalForms: number;
    totalStarts: number;
    totalSubmits: number;
    totalAbandons: number;
    overallConversionRate: number;
  };
}

export default function FormsPage() {
  const { selectedSite, loading: siteLoading } = useSite();
  const [data, setData] = useState<FormsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      if (!selectedSite) return;

      try {
        const res = await fetch(`/api/forms?site_id=${selectedSite.id}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [selectedSite]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 70) return '#10b981'; // green
    if (rate >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  if (siteLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading form analytics...</p>
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

  if (!data) return null;

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
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Form Analytics</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/visitors" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Visitors</Link>
            <Link href="/forms" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Forms</Link>
            <Link href="/goals" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Goals</Link>
            <Link href="/funnels" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Funnels</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: 700 }}>📝 Form Analytics</h2>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Track form submissions, abandonment, and completion times
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Total Forms</p>
            <p style={{ margin: '8px 0 0', color: '#22d3ee', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.totalForms}
            </p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Form Starts</p>
            <p style={{ margin: '8px 0 0', color: '#f59e0b', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.totalStarts.toLocaleString()}
            </p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Submissions</p>
            <p style={{ margin: '8px 0 0', color: '#10b981', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.totalSubmits.toLocaleString()}
            </p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Conversion Rate</p>
            <p style={{ margin: '8px 0 0', color: getConversionColor(data.stats.overallConversionRate), fontSize: '32px', fontWeight: 700 }}>
              {data.stats.overallConversionRate}%
            </p>
          </div>
        </div>

        {/* Forms List */}
        {data.forms.length === 0 ? (
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '80px 20px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <p style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 600, margin: 0 }}>No form data yet</p>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '8px 0 0' }}>
              Forms will appear here once users interact with them
            </p>
          </div>
        ) : (
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Form Name
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Starts
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Submits
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Abandons
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Conversion
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Avg Time
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Visitors
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.forms.map((form, idx) => (
                  <tr
                    key={form.form_id}
                    style={{
                      borderBottom: idx < data.forms.length - 1 ? '1px solid #334155' : 'none'
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <p style={{ margin: 0, color: '#f8fafc', fontSize: '14px', fontWeight: 500 }}>
                        {form.form_name}
                      </p>
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
                        {form.form_id}
                      </p>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#f59e0b', fontSize: '14px', fontWeight: 600 }}>
                      {form.starts}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#10b981', fontSize: '14px', fontWeight: 600 }}>
                      {form.submits}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#ef4444', fontSize: '14px', fontWeight: 600 }}>
                      {form.abandons}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span
                        style={{
                          background: getConversionColor(form.conversionRate) + '20',
                          color: getConversionColor(form.conversionRate),
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: 600
                        }}
                      >
                        {form.conversionRate}%
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      {formatTime(form.avgTimeToComplete)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>
                      {form.uniqueVisitors}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
