'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';
import Navigation from '../../components/Navigation';
import Logo from '../../components/Logo';
import SiteSelector from '../../components/SiteSelector';

interface Segment {
  id: string;
  name: string;
  description: string;
  rules: Record<string, unknown>[];
  user_count: number;
  created_at: string;
  updated_at: string;
}

export default function SegmentsPage() {
  const { selectedSite, loading: siteLoading } = useSite();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSegments() {
      if (!selectedSite) return;

      try {
        const res = await fetch(`/api/segments?site_id=${selectedSite.id}`);
        const data = await res.json();
        setSegments(data.segments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSegments();
  }, [selectedSite]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) return;
    if (!selectedSite) return;

    try {
      await fetch(`/api/segments/${id}?site_id=${selectedSite.id}`, { method: 'DELETE' });
      setSegments(segments.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (siteLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 500 }}>Loading segments...</p>
      </div>
    );
  }

  if (!selectedSite) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 500 }}>No site selected</p>
          <Link href="/" style={{ color: '#2563eb', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
      }}>
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: 700 }}>🎯 Audience Segments</h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '15px' }}>Create and manage custom audiences based on user behavior</p>
          </div>
          <Link href="/segments/new" style={{
            background: '#2563eb',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}>
            + Create Segment
          </Link>
        </div>

        {/* Segments Grid */}
        {segments.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '64px 48px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ color: '#1e293b', margin: '0 0 8px', fontSize: '20px', fontWeight: 600 }}>No Segments Yet</h3>
            <p style={{ color: '#64748b', margin: '0 0 32px', fontSize: '15px' }}>Create your first audience segment to target specific users</p>
            <Link href="/segments/new" style={{
              background: '#2563eb',
              color: '#fff',
              padding: '12px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              display: 'inline-block',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
              Create Your First Segment
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {segments.map((segment) => (
              <div key={segment.id} style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '17px', color: '#1e293b', fontWeight: 600 }}>{segment.name}</h3>
                    <span style={{
                      background: '#eff6ff',
                      color: '#2563eb',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: '1px solid #dbeafe'
                    }}>
                      {segment.user_count} users
                    </span>
                  </div>
                  <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: '14px', minHeight: '40px', lineHeight: '1.5' }}>
                    {segment.description || 'No description'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {segment.rules.slice(0, 3).map((rule, i) => (
                      <span key={i} style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        {String(rule.type || '')}
                      </span>
                    ))}
                    {segment.rules.length > 3 && (
                      <span style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        +{segment.rules.length - 3} more
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                    Created {formatDate(segment.created_at)}
                  </div>
                </div>
                <div style={{
                  borderTop: '1px solid #e2e8f0',
                  padding: '14px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: '#f8fafc'
                }}>
                  <Link href={`/segments/${segment.id}`} style={{
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 600
                  }}>
                    View Details →
                  </Link>
                  <button
                    onClick={() => handleDelete(segment.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500
                    }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
