'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalVisitors: number;
  totalPageViews: number;
  totalEvents: number;
  identifiedVisitors: number;
}

interface RecentEvent {
  id: string;
  event_type: string;
  page_path: string;
  timestamp: string;
  visitor_id: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const data = await res.json();
        setStats(data.stats);
        setRecentEvents(data.recentEvents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  const conversionRate = stats && stats.totalVisitors > 0 
    ? ((stats.identifiedVisitors / stats.totalVisitors) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Boopin Data Platform</h1>
                <p className="text-slate-400 text-sm">1st Party Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-slate-400 text-sm">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                <p className="text-white font-medium">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">B</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Visitors" 
            value={stats?.totalVisitors || 0}
            icon={<UsersIcon />}
            color="cyan"
            subtitle="Unique visitors"
          />
          <StatCard 
            title="Page Views" 
            value={stats?.totalPageViews || 0}
            icon={<EyeIcon />}
            color="blue"
            subtitle="Total views"
          />
          <StatCard 
            title="Total Events" 
            value={stats?.totalEvents || 0}
            icon={<BoltIcon />}
            color="purple"
            subtitle="All interactions"
          />
          <StatCard 
            title="Identified Users" 
            value={stats?.identifiedVisitors || 0}
            icon={<UserCheckIcon />}
            color="green"
            subtitle={`${conversionRate}% conversion`}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Events - Takes 2 columns */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">Recent Events</h2>
              </div>
              <span className="text-slate-400 text-sm">{recentEvents.length} events</span>
            </div>
            
            <div className="overflow-x-auto">
              {recentEvents.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-slate-400">No events yet</p>
                  <p className="text-slate-500 text-sm mt-1">Install the tracking pixel to start collecting data</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Page</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {recentEvents.slice(0, 10).map((event) => (
                      <tr key={event.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4">
                          <EventBadge type={event.event_type} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-300 text-sm font-mono">
                            {formatPagePath(event.page_path)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-400 text-sm">
                            {formatTime(event.timestamp)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Event Breakdown */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Event Breakdown</h2>
            </div>
            
            <EventBreakdown events={recentEvents} />
          </div>
        </div>

        {/* Pixel Installation */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Install Tracking Pixel</h2>
          </div>
          <div className="p-6">
            <p className="text-slate-400 mb-4">Add this script before the closing <code className="text-cyan-400">&lt;/body&gt;</code> tag:</p>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
              <pre className="text-sm text-slate-300 font-mono">
{`<script>
(function(w,d,s,u,k){
  w._bp=w._bp||[];w._bp.push(['init',k]);
  var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s);
  j.async=true;j.src=u;
  f.parentNode.insertBefore(j,f);
})(window,document,'script',
  '${typeof window !== 'undefined' ? window.location.origin : 'https://boopin-data-platform.vercel.app'}/pixel.js',
  'YOUR_API_KEY');
</script>`}
              </pre>
            </div>
            <p className="text-slate-500 text-sm mt-3">Replace <code className="text-cyan-400">YOUR_API_KEY</code> with your client API key.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color, subtitle }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  color: 'cyan' | 'blue' | 'purple' | 'green';
  subtitle: string;
}) {
  const colors = {
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/20',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
  };

  const bgColors = {
    cyan: 'bg-cyan-500/10',
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10',
    green: 'bg-emerald-500/10',
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg flex items-center justify-center`}>
          {icon}
        </div>
        <div className={`px-2 py-1 rounded-full ${bgColors[color]}`}>
          <span className="text-xs text-slate-400">Live</span>
        </div>
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</p>
      <p className="text-slate-500 text-sm">{subtitle}</p>
    </div>
  );
}

// Event Badge Component
function EventBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    page_view: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    click: 'bg-green-500/20 text-green-400 border-green-500/30',
    form_submit: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    identify: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    button_click: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  const icons: Record<string, React.ReactNode> = {
    page_view: <EyeIcon className="w-3 h-3" />,
    click: <CursorIcon className="w-3 h-3" />,
    form_submit: <FormIcon className="w-3 h-3" />,
    identify: <UserCheckIcon className="w-3 h-3" />,
    button_click: <CursorIcon className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
      {icons[type] || null}
      {type.replace('_', ' ')}
    </span>
  );
}

// Event Breakdown Component
function EventBreakdown({ events }: { events: RecentEvent[] }) {
  const counts: Record<string, number> = {};
  events.forEach(e => {
    counts[e.event_type] = (counts[e.event_type] || 0) + 1;
  });

  const total = events.length || 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const colors: Record<string, string> = {
    page_view: 'bg-blue-500',
    click: 'bg-green-500',
    form_submit: 'bg-purple-500',
    identify: 'bg-amber-500',
    button_click: 'bg-cyan-500',
  };

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">No data yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sorted.map(([type, count]) => (
        <div key={type}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-300 text-sm capitalize">{type.replace('_', ' ')}</span>
            <span className="text-slate-400 text-sm">{count}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${colors[type] || 'bg-slate-500'}`}
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper Functions
function formatPagePath(path: string): string {
  if (!path) return '-';
  if (path.includes('/Users/') || path.includes('/home/')) {
    return '/' + path.split('/').pop() || 'local';
  }
  return path.length > 30 ? path.substring(0, 30) + '...' : path;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
}

// Icons
function UsersIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={`${className} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function EyeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={`${className} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function BoltIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={`${className} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function UserCheckIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={`${className} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function CursorIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={`${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
    </svg>
  );
}

function FormIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={`${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
