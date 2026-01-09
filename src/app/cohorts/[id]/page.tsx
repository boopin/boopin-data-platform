'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSite } from '../../../contexts/SiteContext';

interface RetentionData {
  period: number;
  visitorsReturned: number;
  retentionRate: number;
}

interface CohortGroup {
  cohortPeriod: string;
  cohortSize: number;
  retentionData: RetentionData[];
}

interface CohortAnalysis {
  cohort: {
    id: string;
    name: string;
    description: string;
    interval_type: string;
    retention_periods: number[];
  };
  analysis: CohortGroup[];
  totalCohorts: number;
}

export default function CohortAnalysisPage() {
  const params = useParams();
  const cohortId = params.id as string;
  const { selectedSite, loading: siteLoading } = useSite();

  const [analysis, setAnalysis] = useState<CohortAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedSite) {
      fetchAnalysis();
    }
  }, [cohortId, selectedSite]);

  const fetchAnalysis = async () => {
    if (!selectedSite) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/cohorts/${cohortId}/analyze?site_id=${selectedSite.id}`);
      if (!response.ok) {
        const error = await response.json();
        console.error('Error from API:', error.error || 'Unknown error');
        throw new Error(error.error || 'Failed to fetch analysis');
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRetentionColor = (rate: number): string => {
    if (rate >= 70) return '#10b981'; // Green
    if (rate >= 50) return '#f59e0b'; // Orange
    if (rate >= 30) return '#ef4444'; // Red
    return '#64748b'; // Gray
  };

  const getRetentionBgColor = (rate: number): string => {
    if (rate >= 70) return '#10b98120';
    if (rate >= 50) return '#f59e0b20';
    if (rate >= 30) return '#ef444420';
    return '#64748b10';
  };

  const handleExport = () => {
    const url = `/api/cohorts/${cohortId}/export`;
    window.location.href = url;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading analysis...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Failed to load cohort analysis</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navigation Header */}
      <header style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.95)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 700 }}>Pulse Analytics</h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Cohort Analysis</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/visitors" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Visitors</Link>
            <Link href="/segments" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Segments</Link>
            <Link href="/reports" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Reports</Link>
            <Link href="/live" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Live</Link>
            <Link href="/goals" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Goals</Link>
            <Link href="/funnels" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Funnels</Link>
            <Link href="/cohorts" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Cohorts</Link>
            <Link href="/settings/api-keys" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>API Keys</Link>
            <Link href="/settings/webhooks" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Webhooks</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <Link
              href="/cohorts"
              style={{
                display: 'inline-block',
                marginBottom: '16px',
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              ← Back to Cohorts
            </Link>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              {analysis.cohort.name}
            </h1>
            {analysis.cohort.description && (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                {analysis.cohort.description}
              </p>
            )}
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '13px',
                padding: '6px 12px',
                background: '#667eea20',
                color: '#a78bfa',
                borderRadius: '6px',
                fontWeight: 500
              }}>
                {analysis.cohort.interval_type} cohorts
              </span>
              <span style={{
                fontSize: '13px',
                padding: '6px 12px',
                background: '#06b6d420',
                color: '#22d3ee',
                borderRadius: '6px',
                fontWeight: 500
              }}>
                {analysis.totalCohorts} total cohorts (showing {analysis.analysis.length})
              </span>
              <button
                onClick={handleExport}
                style={{
                  fontSize: '13px',
                  padding: '6px 16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          {/* Retention Matrix */}
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            border: '1px solid #334155',
            overflow: 'hidden',
            marginBottom: '24px'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                Retention Matrix
              </h2>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                Percentage of users who return after N days
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', position: 'sticky', left: 0, background: '#0f172a', zIndex: 10 }}>
                      Cohort Period
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      Size
                    </th>
                    {analysis.cohort.retention_periods.map((period) => (
                      <th key={period} style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                        Day {period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analysis.analysis.map((cohortGroup, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#fff', position: 'sticky', left: 0, background: '#1e293b', zIndex: 5 }}>
                        {cohortGroup.cohortPeriod}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
                        {cohortGroup.cohortSize.toLocaleString()}
                      </td>
                      {cohortGroup.retentionData.map((retention, retIdx) => (
                        <td key={retIdx} style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            background: getRetentionBgColor(retention.retentionRate),
                            color: getRetentionColor(retention.retentionRate),
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            minWidth: '60px'
                          }}>
                            {retention.retentionRate.toFixed(1)}%
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            {retention.visitorsReturned}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            border: '1px solid #334155',
            padding: '20px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
              Color Legend
            </h3>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', background: '#10b98120', border: '1px solid #10b981', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Excellent (≥70%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', background: '#f59e0b20', border: '1px solid #f59e0b', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Good (50-69%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', background: '#ef444420', border: '1px solid #ef4444', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Fair (30-49%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', background: '#64748b10', border: '1px solid #64748b', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Low (&lt;30%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
