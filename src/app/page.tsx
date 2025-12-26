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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Boopin Data Platform</h1>
          <p className="text-gray-500 mt-1">1st Party Data Analytics Dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Visitors" 
            value={stats?.totalVisitors || 0} 
            color="bg-blue-500" 
          />
          <StatCard 
            title="Page Views" 
            value={stats?.totalPageViews || 0} 
            color="bg-green-500" 
          />
          <StatCard 
            title="Total Events" 
            value={stats?.totalEvents || 0} 
            color="bg-purple-500" 
          />
          <StatCard 
            title="Identified Users" 
            value={stats?.identifiedVisitors || 0} 
            color="bg-orange-500" 
          />
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
          {recentEvents.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No events yet. Install the tracking pixel to start collecting data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 font-medium text-gray-600">Event</th>
                    <th className="pb-3 font-medium text-gray-600">Page</th>
                    <th className="pb-3 font-medium text-gray-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((event) => (
                    <tr key={event.id} className="border-b last:border-0">
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          event.event_type === 'page_view' ? 'bg-blue-100 text-blue-700' :
                          event.event_type === 'click' ? 'bg-green-100 text-green-700' :
                          event.event_type === 'form_submit' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {event.event_type}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">{event.page_path || '-'}</td>
                      <td className="py-3 text-gray-500 text-sm">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pixel Installation */}
        <div className="mt-8 bg-gray-800 rounded-lg shadow p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Install Tracking Pixel</h2>
          <p className="text-gray-300 mb-4">Add this script to your website before the closing &lt;/body&gt; tag:</p>
          <pre className="bg-gray-900 p-4 rounded overflow-x-auto text-sm">
{`<script>
(function(w,d,s,u,k){
  w._bp=w._bp||[];w._bp.push(['init',k]);
  var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s);
  j.async=true;j.src=u;
  f.parentNode.insertBefore(j,f);
})(window,document,'script','${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app'}/pixel.js','YOUR_API_KEY');
</script>`}
          </pre>
          <p className="text-gray-400 text-sm mt-2">Replace YOUR_API_KEY with your client API key.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4`}>
        <span className="text-white text-xl font-bold">#</span>
      </div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
    </div>
  );
}
