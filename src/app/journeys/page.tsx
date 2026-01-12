'use client';
import Logo from '../../components/Logo';
import SiteSelector from '../../components/SiteSelector';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';
import Navigation from '../../components/Navigation';

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
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading journeys...</p>
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
          <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: 700 }}>🛤️ User Journeys</h2>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
            Visualize how users navigate through your site
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Total Sessions</p>
            <p style={{ margin: '8px 0 0', color: '#2563eb', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.totalSessions.toLocaleString()}
            </p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Avg Session Depth</p>
            <p style={{ margin: '8px 0 0', color: '#10b981', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.avgSessionDepth} pages
            </p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Unique Paths</p>
            <p style={{ margin: '8px 0 0', color: '#f59e0b', fontSize: '32px', fontWeight: 700 }}>
              {data.stats.uniquePaths.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Common Paths */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>📊 Most Common Paths</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.commonPaths.slice(0, 10).map((pathData, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>
                    {pathData.count} sessions ({pathData.percentage.toFixed(1)}%)
                  </span>
                  <div
                    style={{
                      background: '#06b6d4',
                      color: '#1e293b',
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
                          background: '#f8fafc',
                          color: '#2563eb',
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
            <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>🚪 Top Entry Pages</h3>
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
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
                    <p style={{ margin: 0, color: '#2563eb', fontSize: '14px', fontFamily: 'monospace', fontWeight: 500 }}>
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
            <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>🚶 Top Exit Pages</h3>
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
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
