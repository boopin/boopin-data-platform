'use client';
import Logo from '../../components/Logo';
import SiteSelector from '../../components/SiteSelector';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';
import Navigation from '../../components/Navigation';

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
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading form analytics...</p>
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

  if (!data) return null;

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
          <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: 700 }}>📝 Form Analytics</h2>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
            Track form submissions, abandonment, and completion times
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Total Forms</p>
            <p style={{ margin: '8px 0 0', color: '#2563eb', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.totalForms}
            </p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Form Starts</p>
            <p style={{ margin: '8px 0 0', color: '#f59e0b', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.totalStarts.toLocaleString()}
            </p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Submissions</p>
            <p style={{ margin: '8px 0 0', color: '#10b981', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.totalSubmits.toLocaleString()}
            </p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Conversion Rate</p>
            <p style={{ margin: '8px 0 0', color: getConversionColor(data.stats.overallConversionRate), fontSize: '32px', fontWeight: 700 }}>
              {data.stats.overallConversionRate}%
            </p>
          </div>
        </div>

        {/* Forms List */}
        {data.forms.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '80px 20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <p style={{ color: '#1e293b', fontSize: '18px', fontWeight: 600, margin: 0 }}>No form data yet</p>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '8px 0 0' }}>
              Forms will appear here once users interact with them
            </p>
          </div>
        ) : (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
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
                      <p style={{ margin: 0, color: '#1e293b', fontSize: '14px', fontWeight: 500 }}>
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
                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      {formatTime(form.avgTimeToComplete)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
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
