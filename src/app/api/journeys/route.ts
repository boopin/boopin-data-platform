import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    // Get page view sequences for sessions
    const sequences = await sql`
      WITH session_pages AS (
        SELECT
          session_id,
          visitor_id,
          page_path,
          timestamp,
          ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp) as step_number
        FROM events
        WHERE event_type = 'page_view'
          AND site_id = ${siteId}
          AND timestamp >= NOW() - INTERVAL '30 days'
        ORDER BY session_id, timestamp
      )
      SELECT
        session_id,
        visitor_id,
        ARRAY_AGG(page_path ORDER BY step_number) as path,
        COUNT(*) as steps,
        MIN(timestamp) as session_start,
        MAX(timestamp) as session_end
      FROM session_pages
      GROUP BY session_id, visitor_id
      HAVING COUNT(*) >= 2
      ORDER BY session_start DESC
      LIMIT ${limit}
    `;

    // Build path flows for Sankey diagram
    const pathFlows: { [key: string]: number } = {};
    const nodes = new Set<string>();

    sequences.forEach((session: any) => {
      const path = session.path;

      // Create flows between consecutive pages
      for (let i = 0; i < path.length - 1; i++) {
        const source = path[i];
        const target = path[i + 1];
        const flowKey = `${source} → ${target}`;

        nodes.add(source);
        nodes.add(target);

        pathFlows[flowKey] = (pathFlows[flowKey] || 0) + 1;
      }
    });

    // Convert to Sankey-compatible format
    const links = Object.entries(pathFlows)
      .map(([flow, count]) => {
        const [source, target] = flow.split(' → ');
        return { source, target, value: count };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 50); // Limit to top 50 flows for readability

    // Get unique nodes from links
    const nodeSet = new Set<string>();
    links.forEach(link => {
      nodeSet.add(link.source);
      nodeSet.add(link.target);
    });

    const nodeArray = Array.from(nodeSet).map(node => ({
      name: node,
      category: node === '/' ? 'entry' : node.includes('/checkout') ? 'conversion' : 'navigation'
    }));

    // Calculate common paths
    const pathCounts: { [key: string]: number } = {};
    sequences.forEach((session: any) => {
      const pathStr = session.path.join(' → ');
      pathCounts[pathStr] = (pathCounts[pathStr] || 0) + 1;
    });

    const commonPaths = Object.entries(pathCounts)
      .map(([path, count]) => ({
        path: path.split(' → '),
        count,
        percentage: (count / sequences.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Entry and exit pages
    const entryPages: { [key: string]: number } = {};
    const exitPages: { [key: string]: number } = {};

    sequences.forEach((session: any) => {
      const path = session.path;
      if (path.length > 0) {
        const entry = path[0];
        const exit = path[path.length - 1];
        entryPages[entry] = (entryPages[entry] || 0) + 1;
        exitPages[exit] = (exitPages[exit] || 0) + 1;
      }
    });

    const topEntryPages = Object.entries(entryPages)
      .map(([page, count]) => ({ page, count, percentage: (count / sequences.length) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topExitPages = Object.entries(exitPages)
      .map(([page, count]) => ({ page, count, percentage: (count / sequences.length) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Average session depth
    const avgDepth = sequences.reduce((sum: number, s: any) => sum + s.steps, 0) / sequences.length;

    return NextResponse.json({
      sankeyData: {
        nodes: nodeArray,
        links
      },
      commonPaths,
      topEntryPages,
      topExitPages,
      stats: {
        totalSessions: sequences.length,
        avgSessionDepth: Math.round(avgDepth * 10) / 10,
        uniquePaths: Object.keys(pathCounts).length
      }
    });
  } catch (error) {
    console.error('Failed to fetch journey data:', error);
    return NextResponse.json({ error: 'Failed to fetch journey data' }, { status: 500 });
  }
}
