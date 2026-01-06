'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface StepAnalysis {
  stepIndex: number;
  stepName: string;
  stepType: string;
  stepValue: string;
  totalVisitors: number;
  convertedFromPrevious: number;
  dropoffFromPrevious: number;
  conversionRate: number;
  dropoffRate: number;
  avgTimeToConvert: number;
}

interface FunnelAnalysis {
  funnel: {
    id: string;
    name: string;
    description: string;
  };
  analysis: {
    steps: StepAnalysis[];
    overall: {
      totalEntries: number;
      totalCompletions: number;
      overallConversionRate: number;
      avgTotalTimeToConvert: number;
    };
  };
}

export default function FunnelAnalysisPage() {
  const params = useParams();
  const funnelId = params.id as string;

  const [analysis, setAnalysis] = useState<FunnelAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    // Set default date range (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchAnalysis();
    }
  }, [funnelId, dateFrom, dateTo]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/funnels/${funnelId}/analyze?from=${dateFrom}&to=${dateTo}`
      );
      const data = await response.json();

      // Check if the response is an error
      if (data.error || !response.ok) {
        console.error('Error from API:', data.error || 'Failed to fetch');
        setAnalysis(null);
      } else {
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const handleExport = () => {
    const url = `/api/funnels/${funnelId}/export?from=${dateFrom}&to=${dateTo}`;
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
        <p style={{ color: '#94a3b8' }}>Failed to load funnel analysis</p>
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
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Funnel Analysis</p>
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
            <Link href="/funnels" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Funnels</Link>
            <Link href="/cohorts" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Cohorts</Link>
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
          href="/funnels"
          style={{
            display: 'inline-block',
            marginBottom: '16px',
            color: '#667eea',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          ← Back to Funnels
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
          {analysis.funnel.name}
        </h1>
        {analysis.funnel.description && (
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            {analysis.funnel.description}
          </p>
        )}
      </div>

      {/* Date Range Filter */}
      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#718096', marginBottom: '6px' }}>
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#718096', marginBottom: '6px' }}>
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button
            onClick={fetchAnalysis}
            style={{
              padding: '8px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Apply
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: '#fff'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500, opacity: 0.9, marginBottom: '8px' }}>
            Total Entries
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>
            {analysis.analysis.overall.totalEntries.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: '#fff'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500, opacity: 0.9, marginBottom: '8px' }}>
            Total Completions
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>
            {analysis.analysis.overall.totalCompletions.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: '#fff'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500, opacity: 0.9, marginBottom: '8px' }}>
            Overall Conversion
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>
            {analysis.analysis.overall.overallConversionRate}%
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: '#fff'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500, opacity: 0.9, marginBottom: '8px' }}>
            Avg. Time to Convert
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>
            {formatTime(analysis.analysis.overall.avgTotalTimeToConvert)}
          </div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div style={{
        background: '#fff',
        padding: '32px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c', marginBottom: '24px' }}>
          Funnel Visualization
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {analysis.analysis.steps.map((step, index) => {
            const maxWidth = analysis.analysis.overall.totalEntries;
            const widthPercent = maxWidth > 0 ? (step.totalVisitors / maxWidth) * 100 : 0;

            return (
              <div key={index}>
                {/* Step Card */}
                <div style={{ display: 'flex', alignItems: 'stretch', gap: '16px' }}>
                  {/* Step Number */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>

                  {/* Step Content */}
                  <div style={{ flex: 1 }}>
                    {/* Step Header */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a202c' }}>
                        {step.stepName}
                      </div>
                      <div style={{ fontSize: '13px', color: '#718096' }}>
                        {step.stepType === 'event' ? '🎯 Event: ' : '🔗 URL: '}{step.stepValue}
                      </div>
                    </div>

                    {/* Funnel Bar */}
                    <div style={{
                      background: '#f7fafc',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '12px'
                    }}>
                      <div
                        style={{
                          width: `${widthPercent}%`,
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          padding: '16px',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '14px',
                          minWidth: '120px',
                          transition: 'width 0.3s ease'
                        }}
                      >
                        {step.totalVisitors.toLocaleString()} visitors
                      </div>
                    </div>

                    {/* Metrics */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '12px'
                    }}>
                      {index > 0 && (
                        <>
                          <div style={{
                            padding: '12px',
                            background: '#f0fdf4',
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0'
                          }}>
                            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, marginBottom: '4px' }}>
                              Conversion Rate
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#15803d' }}>
                              {step.conversionRate}%
                            </div>
                          </div>

                          <div style={{
                            padding: '12px',
                            background: '#fef2f2',
                            borderRadius: '6px',
                            border: '1px solid #fecaca'
                          }}>
                            <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600, marginBottom: '4px' }}>
                              Drop-off Rate
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#991b1b' }}>
                              {step.dropoffRate}%
                            </div>
                          </div>

                          <div style={{
                            padding: '12px',
                            background: '#eff6ff',
                            borderRadius: '6px',
                            border: '1px solid #bfdbfe'
                          }}>
                            <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600, marginBottom: '4px' }}>
                              Dropped Off
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e40af' }}>
                              {step.dropoffFromPrevious.toLocaleString()}
                            </div>
                          </div>

                          <div style={{
                            padding: '12px',
                            background: '#faf5ff',
                            borderRadius: '6px',
                            border: '1px solid #e9d5ff'
                          }}>
                            <div style={{ fontSize: '11px', color: '#6b21a8', fontWeight: 600, marginBottom: '4px' }}>
                              Avg. Time from Previous
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#6b21a8' }}>
                              {formatTime(step.avgTimeToConvert)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drop-off Indicator */}
                {index < analysis.analysis.steps.length - 1 && step.dropoffFromPrevious > 0 && (
                  <div style={{
                    marginLeft: '64px',
                    marginTop: '12px',
                    marginBottom: '12px',
                    padding: '12px 16px',
                    background: '#fef2f2',
                    borderLeft: '3px solid #ef4444',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontSize: '13px', color: '#991b1b', fontWeight: 600 }}>
                      ⚠️ {step.dropoffFromPrevious.toLocaleString()} visitors ({step.dropoffRate}%) dropped off before reaching the next step
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Details Table */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c' }}>
            Detailed Step Analysis
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#4a5568' }}>Step</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#4a5568' }}>Name</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#4a5568' }}>Visitors</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#4a5568' }}>Conversion</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#4a5568' }}>Drop-off</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#4a5568' }}>Avg. Time</th>
              </tr>
            </thead>
            <tbody>
              {analysis.analysis.steps.map((step, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#2d3748' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#2d3748' }}>
                      {step.stepName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>
                      {step.stepType === 'event' ? '🎯 ' : '🔗 '}{step.stepValue}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: '#2d3748' }}>
                    {step.totalVisitors.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {index > 0 ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: '#f0fdf4',
                        color: '#15803d',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        {step.conversionRate}%
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#a0aec0' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {index > 0 ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: '#fef2f2',
                        color: '#991b1b',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        {step.dropoffRate}%
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#a0aec0' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', color: '#4a5568', fontWeight: 500 }}>
                    {index > 0 ? formatTime(step.avgTimeToConvert) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
