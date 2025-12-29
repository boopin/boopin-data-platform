'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Visitor {
  id: string;
  anonymous_id: string;
  email: string;
  name: string;
  phone: string;
  first_seen_at: string;
  last_seen_at: string;
  visit_count: number;
  is_identified: boolean;
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

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

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = 
      (v.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.phone || '').includes(search) ||
      v.anonymous_id.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'identified') return matchesSearch && v.is_identified;
    if (filter === 'anonymous') return matchesSearch && !v.is_identified;
    return matchesSearch;
  });

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const inputStyle = { background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', fontSize: '13px' };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };

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
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Customer Profiles</p>
              </div>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/visitors" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Visitors</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>Total Visitors</p>
            <p style={{ color: '#fff', margin: '8px 0 0', fontSize: '28px', fontWeight: 700 }}>{visitors.length}</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>Identified</p>
            <p style={{ color: '#10b981', margin: '8px 0 0', fontSize: '28px', fontWeight: 700 }}>{visitors.filter(v => v.is_identified).length}</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>Anonymous</p>
            <p style={{ color: '#f59e0b', margin: '8px 0 0', fontSize: '28px', fontWeight: 700 }}>{visitors.filter(v => !v.is_identified).length}</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>Conversion Rate</p>
            <p style={{ color: '#8b5cf6', margin: '8px 0 0', fontSize: '28px', fontWeight: 700 }}>{visitors.length > 0 ? ((visitors.filter(v => v.is_identified).length / visitors.length) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search by email, name, phone, or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: '250px' }}
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Visitors</option>
            <option value="identified">Identified Only</option>
            <option value="anonymous">Anonymous Only</option>
          </select>
        </div>

        {/* Visitors Table */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 600 }}>👥 All Visitors ({filteredVisitors.length})</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>VISITOR</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>CONTACT</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>VISITS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>FIRST SEEN</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>LAST SEEN</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No visitors found</td>
                  </tr>
                ) : (
                  filteredVisitors.map((visitor) => (
                    <tr key={visitor.id} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{visitor.name || 'Anonymous'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{visitor.anonymous_id.slice(0, 8)}...</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '12px', color: '#22d3ee' }}>{visitor.email || '-'}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{visitor.phone || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#3b82f620', color: '#60a5fa', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{visitor.visit_count}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>{formatDate(visitor.first_seen_at)}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>{formatDate(visitor.last_seen_at)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {visitor.is_identified ? (
                          <span style={{ background: '#10b98120', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>Identified</span>
                        ) : (
                          <span style={{ background: '#f59e0b20', color: '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>Anonymous</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link href={`/visitors/${visitor.id}`} style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', textDecoration: 'none', fontWeight: 500 }}>
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
