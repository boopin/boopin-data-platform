'use client';
import { useEffect, useState } from 'react';
import SiteSelector from '../components/SiteSelector';
import Navigation from '../components/Navigation';
import Logo from '../components/Logo';
import { useSite } from '../contexts/SiteContext';

interface DashboardData {
  stats: {
    totalVisitors: number;
    totalPageViews: number;
    totalEvents: number;
    identifiedVisitors: number;
  };
  recentEvents: Array<{
    id: string;
    event_type: string;
    page_path: string;
    page_url: string;
    timestamp: string;
    visitor_id: string;
    email?: string;
    name?: string;
    device_type: string;
    browser: string;
    os: string;
    country?: string;
    city?: string;
    properties?: Record<string, unknown>;
  }>;
  deviceBreakdown: Array<{ device_type: string; count: number }>;
  browserBreakdown: Array<{ name: string; count: number }>;
  osBreakdown: Array<{ name: string; count: number }>;
  topPages: Array<{ page_path: string; count: number }>;
  eventBreakdown: Array<{ event_type: string; count: number }>;
  trafficSources: Array<{ source: string; count: number }>;
  countryBreakdown: Array<{ country: string; count: number }>;
  cityBreakdown: Array<{ city: string; country: string; count: number }>;
  identifiedUsers: Array<{
    id: string;
    email: string;
    name: string;
    phone?: string;
    first_seen_at: string;
    last_seen_at: string;
    visit_count: number;
  }>;
  filters: {
    countries: string[];
    eventTypes: string[];
  };
}

export default function Dashboard() {
  const { selectedSite } = useSite();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  const fetchData = async () => {
    if (!selectedSite) return;

    try {
      const params = new URLSearchParams();
      params.append('site_id', selectedSite.id);
      if (countryFilter) params.append('country', countryFilter);
      if (eventTypeFilter) params.append('eventType', eventTypeFilter);
      
      // Date range filter
      if (dateRange !== 'all') {
        const now = new Date();
        let dateFrom: Date;
        switch (dateRange) {
          case 'today':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case '7days':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFrom = new Date(0);
        }
        params.append('dateFrom', dateFrom.toISOString());
      }
      
      const url = `/api/dashboard${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedSite, dateRange, countryFilter, eventTypeFilter]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Export to CSV
  const exportToCSV = () => {
    if (!data) return;
    
    const headers = ['Timestamp', 'Event Type', 'User', 'Email', 'Page', 'Country', 'City', 'Device', 'Browser', 'OS'];
    const rows = data.recentEvents.map(e => [
      new Date(e.timestamp).toLocaleString(),
      e.event_type,
      e.name || '',
      e.email || '',
      e.page_path || '',
      e.country || '',
      e.city || '',
      e.device_type || '',
      e.browser || '',
      e.os || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulse-analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Event colors for all event types
  const eventColors: Record<string, string> = { 
    page_view: '#3b82f6', 
    click: '#10b981', 
    button_click: '#06b6d4', 
    form_submit: '#8b5cf6', 
    identify: '#f59e0b', 
    page_leave: '#ef4444',
    scroll_depth: '#a855f7',
    time_on_page: '#ec4899',
    form_start: '#14b8a6',
    form_abandon: '#f97316',
    outbound_click: '#06b6d4',
    product_view: '#8b5cf6',
    add_to_cart: '#22c55e',
    remove_from_cart: '#ef4444',
    cart_view: '#3b82f6',
    begin_checkout: '#f59e0b',
    purchase: '#10b981',
    cart_abandon: '#ef4444',
    lead_form: '#8b5cf6',
    video_start: '#6366f1',
    video_progress: '#a855f7',
    video_complete: '#22c55e',
    file_download: '#06b6d4',
    search: '#f59e0b',
    share: '#ec4899',
    sign_up: '#10b981',
    login: '#3b82f6',
    logout: '#64748b',
    callback_request: '#f59e0b',
    refund: '#ef4444'
  };

  // Event icons
  const eventIcons: Record<string, string> = {
    page_view: '👁️',
    click: '👆',
    button_click: '🔘',
    form_submit: '📝',
    identify: '👤',
    page_leave: '🚪',
    scroll_depth: '📜',
    time_on_page: '⏱️',
    form_start: '✏️',
    form_abandon: '❌',
    outbound_click: '🔗',
    product_view: '🛍️',
    add_to_cart: '🛒',
    remove_from_cart: '🗑️',
    cart_view: '🛒',
    begin_checkout: '💳',
    purchase: '✅',
    cart_abandon: '🛒',
    lead_form: '📋',
    video_start: '▶️',
    video_progress: '⏩',
    video_complete: '🎬',
    file_download: '📥',
    search: '🔍',
    share: '📤',
    sign_up: '🆕',
    login: '🔑',
    logout: '🚶',
    callback_request: '📞',
    refund: '💸'
  };

  // Calculate e-commerce metrics
  const getEcommerceMetrics = () => {
    if (!data) return { purchases: 0, cartAbandonment: 0, addToCarts: 0, checkouts: 0 };
    
    const purchases = data.eventBreakdown.find(e => e.event_type === 'purchase')?.count || 0;
    const cartAbandons = data.eventBreakdown.find(e => e.event_type === 'cart_abandon')?.count || 0;
    const addToCarts = data.eventBreakdown.find(e => e.event_type === 'add_to_cart')?.count || 0;
    
    const cartAbandonment = addToCarts > 0 ? Math.round((cartAbandons / addToCarts) * 100) : 0;
    
    return {
      purchases,
      cartAbandonment,
      addToCarts,
      checkouts: data.eventBreakdown.find(e => e.event_type === 'begin_checkout')?.count || 0
    };
  };

  // Calculate engagement metrics
  const getEngagementMetrics = () => {
    if (!data) return { formStarts: 0, formSubmits: 0, formAbandons: 0, conversionRate: 0, scrollEvents: 0 };
    
    const formStarts = data.eventBreakdown.find(e => e.event_type === 'form_start')?.count || 0;
    const formSubmits = data.eventBreakdown.find(e => e.event_type === 'form_submit')?.count || 0;
    const scrollEvents = data.eventBreakdown.find(e => e.event_type === 'scroll_depth')?.count || 0;
    
    const conversionRate = formStarts > 0 ? Math.round((formSubmits / formStarts) * 100) : 0;
    
    return {
      formStarts,
      formSubmits,
      conversionRate,
      scrollEvents
    };
  };

  const ecomMetrics = getEcommerceMetrics();
  const engagementMetrics = getEngagementMetrics();

  // Styles
  const selectStyle = {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#1e293b',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
    fontWeight: 500
  };

  const buttonStyle = {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 600,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#475569' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p style={{ fontSize: '16px', fontWeight: 500 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '48px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p style={{ color: '#ef4444', fontSize: '16px', fontWeight: 500 }}>{error}</p>
          <button onClick={fetchData} style={{ marginTop: '24px', ...buttonStyle }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Navigation />
            <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }} />
            <SiteSelector />
            <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#1e293b', margin: 0, fontSize: '13px', fontWeight: 500 }}>{currentTime.toLocaleTimeString()}</p>
              <p style={{ color: '#10b981', margin: '2px 0 0', fontSize: '11px', fontWeight: 500 }}>● Live • Updated {Math.round((currentTime.getTime() - lastUpdated.getTime()) / 1000)}s ago</p>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px' }}>

      {/* Filters Row */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '32px',
        flexWrap: 'wrap',
        alignItems: 'center',
        background: '#ffffff',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={selectStyle}>
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
        
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={selectStyle}>
          <option value="">All Countries</option>
          {data?.filters.countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        
        <select value={eventTypeFilter} onChange={e => setEventTypeFilter(e.target.value)} style={selectStyle}>
          <option value="">All Events</option>
          {data?.filters.eventTypes.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        
        <div style={{ flex: 1 }} />
        
        <button onClick={() => { setDateRange('all'); setCountryFilter(''); setEventTypeFilter(''); }} style={{ ...buttonStyle, background: '#334155' }}>
          Clear Filters
        </button>
        
        <button onClick={exportToCSV} style={buttonStyle}>
          📥 Export CSV
        </button>
      </div>

      {/* Main Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Visitors', value: data?.stats.totalVisitors || 0, icon: '👥', color: '#3b82f6' },
          { label: 'Page Views', value: data?.stats.totalPageViews || 0, icon: '👁️', color: '#10b981' },
          { label: 'Total Events', value: data?.stats.totalEvents || 0, icon: '⚡', color: '#f59e0b' },
          { label: 'Identified Users', value: data?.stats.identifiedVisitors || 0, icon: '👤', color: '#8b5cf6' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{stat.label}</p>
                <p style={{ color: '#1e293b', fontSize: '32px', fontWeight: 700, margin: '8px 0 0' }}>{stat.value.toLocaleString()}</p>
              </div>
              <span style={{ fontSize: '24px' }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* E-commerce & Engagement Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Purchases', value: ecomMetrics.purchases, icon: '✅', color: '#10b981' },
          { label: 'Add to Cart', value: ecomMetrics.addToCarts, icon: '🛒', color: '#22c55e' },
          { label: 'Checkouts', value: ecomMetrics.checkouts, icon: '💳', color: '#f59e0b' },
          { label: 'Cart Abandon %', value: `${ecomMetrics.cartAbandonment}%`, icon: '🛒', color: '#ef4444' },
          { label: 'Form Starts', value: engagementMetrics.formStarts, icon: '✏️', color: '#14b8a6' },
          { label: 'Form Submits', value: engagementMetrics.formSubmits, icon: '📝', color: '#8b5cf6' },
          { label: 'Form Conversion', value: `${engagementMetrics.conversionRate}%`, icon: '📊', color: '#3b82f6' },
          { label: 'Scroll Events', value: engagementMetrics.scrollEvents, icon: '📜', color: '#a855f7' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#ffffff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>{stat.label}</p>
                <p style={{ color: stat.color, fontSize: '22px', fontWeight: 700, margin: '4px 0 0' }}>{stat.value}</p>
              </div>
              <span style={{ fontSize: '18px' }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Events */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ color: '#1e293b', fontSize: '16px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> Recent Events
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
              (click to view details)
            </span>
          </h2>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {data?.recentEvents.slice(0, 50).map((event, i) => (
              <a 
                key={i}
                href={`/events/${event.id}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px', 
                  borderBottom: '1px solid #334155',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '18px' }}>{eventIcons[event.event_type] || '📌'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      background: eventColors[event.event_type] || '#64748b', 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      {event.event_type}
                    </span>
                    {event.email && (
                      <span style={{ color: '#22d3ee', fontSize: '12px', fontWeight: 500 }}>
                        {event.name || event.email}
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.page_path || 'N/A'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                  <p style={{ color: '#475569', fontSize: '10px', margin: '2px 0 0' }}>
                    {event.country || ''} {event.device_type === 'mobile' ? '📱' : '💻'}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Event Breakdown */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ color: '#1e293b', fontSize: '16px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> Events by Type
            </h2>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {data?.eventBreakdown.map((event, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px' }}>{eventIcons[event.event_type] || '📌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#1e293b', fontSize: '12px' }}>{event.event_type}</span>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{event.count}</span>
                    </div>
                    <div style={{ height: '4px', background: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(event.count / (data?.stats.totalEvents || 1)) * 100}%`,
                        background: eventColors[event.event_type] || '#64748b',
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Identified Users */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: '#1e293b', fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👤</span> Identified Users
              </h2>
              <a href="/visitors" style={{ color: '#22d3ee', fontSize: '12px', textDecoration: 'none' }}>View all →</a>
            </div>
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {data?.identifiedUsers.slice(0, 10).map((user, i) => (
                <a 
                  key={i} 
                  href={`/visitors/${user.id}`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '10px', 
                    borderBottom: '1px solid #334155',
                    textDecoration: 'none'
                  }}
                >
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}>
                    {(user.name || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#1e293b', fontSize: '13px', margin: 0, fontWeight: 500 }}>
                      {user.name || 'Anonymous'}
                    </p>
                    <p style={{ color: '#64748b', fontSize: '11px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#22d3ee', fontSize: '12px', margin: 0, fontWeight: 600 }}>{user.visit_count}</p>
                    <p style={{ color: '#475569', fontSize: '10px', margin: 0 }}>visits</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Location Breakdown */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ color: '#1e293b', fontSize: '16px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🌍</span> Top Locations
            </h2>
            {data?.cityBreakdown.slice(0, 5).map((city, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                <span style={{ color: '#1e293b', fontSize: '13px' }}>{city.city}, {city.country}</span>
                <span style={{ color: '#22d3ee', fontSize: '13px', fontWeight: 600 }}>{city.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Install Pixel Section */}
      <div style={{ marginTop: '24px', background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
        <h2 style={{ color: '#1e293b', fontSize: '16px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔧</span> Install Tracking Pixel
        </h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>Add this code before the closing &lt;/head&gt; tag:</p>
        <pre style={{
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '12px',
          color: '#1e293b',
          border: '1px solid #e2e8f0',
          fontFamily: 'monospace'
        }}>
{`<script src="https://pulse-analytics-data-platform.vercel.app/pixel.js"></script>
<script>
  // Pixel auto-initializes and tracks page views automatically
  
  // Optional: Identify users when they log in or submit forms
  pulseAnalytics.identify('user@email.com', {
    name: 'John Doe',
    phone: '+1234567890'
  });
  
  // Optional: Track e-commerce events
  pulseAnalytics.addToCart({ id: 'SKU123', name: 'Product', price: 99.99 });
  pulseAnalytics.purchase({ orderId: 'ORD-001', total: 99.99, currency: 'USD' });
</script>`}
        </pre>
      </div>
      </main>
    </div>
  );
}
