'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Visitor {
  id: string;
  anonymous_id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  first_seen_at: string;
  last_seen_at: string;
  visit_count: number;
  is_identified: boolean;
  event_count?: number;
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'identified' | 'anonymous'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchVisitors() {
      try {
        const res = await fetch('/api/visitors');
        const data = await res.json();
        setVisitors(data.visitors || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchVisitors();
  }, []);

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredVisitors = visitors.filter(v => {
    // Filter by type
    if (filter === 'identified' && !v.is_identified) return false;
    if (filter === 'anonymous' && v.is_identified) return false;
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        v.email?.toLowerCase().includes(searchLower) ||
        v.name?.toLowerCase().includes(searchLower) ||
        v.phone?.includes(search) ||
        v.anonymous_id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const identifiedCount = visitors.filter(v => v.is_identified).length;
  const anonymousCount = visitors.filter(v => !v.is_identified).length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading visitors...</p>
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
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Visitor Profiles</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/visitors" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Visitors</Link>
            <Link href="/segments" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Segments</Link>
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
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: 700 }}>👥 All Visitors</h2>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            {visitors.length} total visitors • {identifiedCount} identified • {anonymousCount} anonymous
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              width: '300px'
            }}
          />
          
          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'all', label: 'All', count: visitors.length },
              { key: 'identified', label: '👤 Identified', count: identifiedCount },
              { key: 'anonymous', label: '👻 Anonymous', count: anonymousCount }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                style={{
                  background: filter === f.key ? '#3b82f6' : '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {f.label}
                <span style={{ 
                  background: filter === f.key ? '#1d4ed8' : '#1e293b', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Visitors Table */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>VISITOR</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>CONTACT</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>VISITS</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>FIRST SEEN</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>LAST SEEN</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    No visitors found
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((visitor) => (
                  <tr key={visitor.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          background: visitor.is_identified 
                            ? 'linear-gradient(135deg, #10b981, #059669)' 
                            : 'linear-gradient(135deg, #64748b, #475569)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '16px'
                        }}>
                          {visitor.is_identified ? '👤' : '👻'}
                        </div>
                        <div>
                          <p style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                            {visitor.name || (visitor.is_identified ? 'Identified User' : 'Anonymous')}
                          </p>
                          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>
                            {visitor.anonymous_id.slice(0, 16)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {visitor.email && (
                        <p style={{ margin: 0, color: '#22d3ee', fontSize: '13px' }}>{visitor.email}</p>
                      )}
                      {visitor.phone && (
                        <p style={{ margin: '2px 0 0', color: '#a78bfa', fontSize: '12px' }}>{visitor.phone}</p>
                      )}
                      {!visitor.email && !visitor.phone && (
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>—</p>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ 
                        background: '#f59e0b20', 
                        color: '#f59e0b', 
                        padding: '4px 12px', 
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        {visitor.visit_count}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>
                      {formatDateTime(visitor.first_seen_at)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>
                      {formatDateTime(visitor.last_seen_at)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Link
                          href={`/visitors/${visitor.id}`}
                          style={{
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            color: '#fff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            textDecoration: 'none',
                            fontWeight: 500,
                            display: 'inline-block'
                          }}
                        >
                          👤 Profile
                        </Link>
                        <Link
                          href={`/visitors/${visitor.id}?tab=journey`}
                          style={{
                            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                            color: '#fff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            textDecoration: 'none',
                            fontWeight: 500,
                            display: 'inline-block'
                          }}
                        >
                          🛤️ Journey
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
