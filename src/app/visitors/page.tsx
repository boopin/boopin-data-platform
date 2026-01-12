'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../contexts/SiteContext';
import Navigation from '../../components/Navigation';
import Logo from '../../components/Logo';
import SiteSelector from '../../components/SiteSelector';

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
  const { selectedSite, loading: siteLoading } = useSite();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'identified' | 'anonymous'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchVisitors() {
      if (!selectedSite) return;

      try {
        const res = await fetch(`/api/visitors?site_id=${selectedSite.id}`);
        const data = await res.json();
        setVisitors(data.visitors || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchVisitors();
  }, [selectedSite]);

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Anonymous ID', 'Name', 'Email', 'Phone', 'Type', 'Visit Count', 'First Seen', 'Last Seen'];
    const rows = filteredVisitors.map(v => [
      v.id,
      v.anonymous_id,
      v.name || '',
      v.email || '',
      v.phone || '',
      v.is_identified ? 'Identified' : 'Anonymous',
      v.visit_count,
      v.first_seen_at,
      v.last_seen_at
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = filteredVisitors.map(v => ({
      id: v.id,
      anonymous_id: v.anonymous_id,
      name: v.name,
      email: v.email,
      phone: v.phone,
      is_identified: v.is_identified,
      visit_count: v.visit_count,
      first_seen_at: v.first_seen_at,
      last_seen_at: v.last_seen_at
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  if (siteLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading visitors...</p>
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
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b', fontWeight: 700 }}>👥 All Visitors</h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
              {visitors.length} total visitors • {identifiedCount} identified • {anonymousCount} anonymous
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={exportToCSV}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              📊 Export CSV
            </button>
            <button
              onClick={exportToJSON}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              📦 Export JSON
            </button>
          </div>
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
              background: '#ffffff',
              color: '#1e293b',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '14px',
              width: '300px',
              outline: 'none',
              fontWeight: 500
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
                  background: filter === f.key ? '#2563eb' : '#ffffff',
                  color: filter === f.key ? '#ffffff' : '#475569',
                  border: `1px solid ${filter === f.key ? '#2563eb' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                {f.label}
                <span style={{
                  background: filter === f.key ? '#1d4ed8' : '#f1f5f9',
                  color: filter === f.key ? '#ffffff' : '#64748b',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Visitors Table */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>VISITOR</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CONTACT</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>VISITS</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>FIRST SEEN</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>LAST SEEN</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACTIONS</th>
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
                  <tr key={visitor.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: visitor.is_identified
                            ? '#d1fae5'
                            : '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          border: `2px solid ${visitor.is_identified ? '#10b981' : '#cbd5e1'}`
                        }}>
                          {visitor.is_identified ? '👤' : '👻'}
                        </div>
                        <div>
                          <p style={{ margin: 0, color: '#1e293b', fontSize: '14px', fontWeight: 500 }}>
                            {visitor.name || (visitor.is_identified ? 'Identified User' : 'Anonymous')}
                          </p>
                          <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}>
                            {visitor.anonymous_id.slice(0, 16)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {visitor.email && (
                        <p style={{ margin: 0, color: '#2563eb', fontSize: '13px' }}>{visitor.email}</p>
                      )}
                      {visitor.phone && (
                        <p style={{ margin: '2px 0 0', color: '#6366f1', fontSize: '12px' }}>{visitor.phone}</p>
                      )}
                      {!visitor.email && !visitor.phone && (
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>—</p>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        background: '#fef3c7',
                        color: '#f59e0b',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        {visitor.visit_count}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                      {formatDateTime(visitor.first_seen_at)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                      {formatDateTime(visitor.last_seen_at)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Link
                          href={`/visitors/${visitor.id}`}
                          style={{
                            background: '#2563eb',
                            color: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'inline-block',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                          }}
                        >
                          👤 Profile
                        </Link>
                        <Link
                          href={`/visitors/${visitor.id}?tab=journey`}
                          style={{
                            background: '#ffffff',
                            color: '#475569',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            textDecoration: 'none',
                            fontWeight: 500,
                            display: 'inline-block',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
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
