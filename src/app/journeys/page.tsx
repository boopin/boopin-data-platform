'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';

interface PathFlow {
  path: string[];
  count: number;
  percentage: number;
}

interface PageStat {
  page: string;
  count: number;
  percentage: number;
}

interface JourneyData {
  commonPaths: PathFlow[];
  topEntryPages: PageStat[];
  topExitPages: PageStat[];
  stats: {
    totalSessions: number;
    avgSessionDepth: number;
    uniquePaths: number;
  };
}

export default function JourneysPage() {
  const { selectedSite, loading: siteLoading } = useSite();
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJourneys = async () => {
      if (!selectedSite) return;

      try {
        const res = await fetch(`/api/journeys?site_id=${selectedSite.id}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJourneys();
  }, [selectedSite]);

  if (siteLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading journeys...</p>
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
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>User Journeys</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/visitors" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Visitors</Link>
            <Link href="/journeys" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Journeys</Link>
            <Link href="/goals" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Goals</Link>
            <Link href="/funnels" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Funnels</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: 700 }}>🛤️ User Journeys</h2>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Visualize how users navigate through your site
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Total Sessions</p>
            <p style={{ margin: '8px 0 0', color: '#22d3ee', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.totalSessions.toLocaleString()}
            </p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Avg Session Depth</p>
            <p style={{ margin: '8px 0 0', color: '#10b981', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.avgSessionDepth} pages
            </p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Unique Paths</p>
            <p style={{ margin: '8px 0 0', color: '#f59e0b', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.uniquePaths.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Common Paths */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#fff', fontWeight: 600 }}>📊 Most Common Paths</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.commonPaths.slice(0, 10).map((pathData, idx) => (
              <div
                key={idx}
                style={{
                  background: '#1e293b',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #334155'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>
                    {pathData.count} sessions ({pathData.percentage.toFixed(1)}%)
                  </span>
                  <div
                    style={{
                      background: '#06b6d4',
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    #{idx + 1}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {pathData.path.map((page, pageIdx) => (
                    <div key={pageIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          background: '#0f172a',
                          color: '#22d3ee',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          fontWeight: 500
                        }}
                      >
                        {page}
                      </div>
                      {pageIdx < pathData.path.length - 1 && (
                        <span style={{ color: '#64748b', fontSize: '18px' }}>→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Entry & Exit Pages */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Entry Pages */}
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#fff', fontWeight: 600 }}>🚪 Top Entry Pages</h3>
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
              {data.topEntryPages.map((page, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderBottom: idx < data.topEntryPages.length - 1 ? '1px solid #334155' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <p style={{ margin: 0, color: '#22d3ee', fontSize: '14px', fontFamily: 'monospace', fontWeight: 500 }}>
                      {page.page}
                    </p>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                      {page.count} sessions
                    </p>
                  </div>
                  <div style={{ color: '#10b981', fontSize: '16px', fontWeight: 600 }}>
                    {page.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exit Pages */}
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#fff', fontWeight: 600 }}>🚶 Top Exit Pages</h3>
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
              {data.topExitPages.map((page, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderBottom: idx < data.topExitPages.length - 1 ? '1px solid #334155' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <p style={{ margin: 0, color: '#f59e0b', fontSize: '14px', fontFamily: 'monospace', fontWeight: 500 }}>
                      {page.page}
                    </p>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                      {page.count} sessions
                    </p>
                  </div>
                  <div style={{ color: '#ef4444', fontSize: '16px', fontWeight: 600 }}>
                    {page.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
