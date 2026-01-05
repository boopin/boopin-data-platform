'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSegments() {
      try {
        const res = await fetch('/api/segments');
        const data = await res.json();
        setSegments(data.segments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSegments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) return;
    
    try {
      await fetch(`/api/segments/${id}`, { method: 'DELETE' });
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.95)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 700 }}>Boopin Data Platform</h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Audience Segments</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/visitors" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Visitors</Link>
            <Link href="/segments" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Segments</Link>
            <Link href="/reports" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Reports</Link>
            <Link href="/live" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Live</Link>
            <Link href="/goals" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Goals</Link>
            <Link href="/funnels" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Funnels</Link>
            <Link href="/settings/api-keys" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>API Keys</Link>
            <Link href="/settings/webhooks" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Webhooks</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: 700 }}>🎯 Audience Segments</h2>
            <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>Create and manage custom audiences based on user behavior</p>
          </div>
          <Link href="/segments/new" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            + Create Segment
          </Link>
        </div>

        {/* Segments Grid */}
        {segments.length === 0 ? (
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '18px' }}>No Segments Yet</h3>
            <p style={{ color: '#94a3b8', margin: '0 0 24px', fontSize: '14px' }}>Create your first audience segment to target specific users</p>
            <Link href="/segments/new" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              Create Your First Segment
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {segments.map((segment) => (
              <div key={segment.id} style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 600 }}>{segment.name}</h3>
                    <span style={{ background: '#8b5cf620', color: '#a78bfa', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                      {segment.user_count} users
                    </span>
                  </div>
                  <p style={{ color: '#94a3b8', margin: '0 0 16px', fontSize: '13px', minHeight: '40px' }}>
                    {segment.description || 'No description'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {segment.rules.slice(0, 3).map((rule, i) => (
                      <span key={i} style={{ background: '#0f172a', color: '#64748b', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        {String(rule.type || '')}
                      </span>
                    ))}
                    {segment.rules.length > 3 && (
                      <span style={{ background: '#0f172a', color: '#64748b', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        +{segment.rules.length - 3} more
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>
                    Created {formatDate(segment.created_at)}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #334155', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', background: '#0f172a' }}>
                  <Link href={`/segments/${segment.id}`} style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                    View Details →
                  </Link>
                  <button onClick={() => handleDelete(segment.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>
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
