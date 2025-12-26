import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`SELECT NOW() as time, COUNT(*) as client_count FROM clients`;
    return NextResponse.json({ 
      status: 'ok', 
      database: 'connected',
      time: result[0].time,
      clients: result[0].client_count
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) }, 
      { status: 500 }
    );
  }
}
