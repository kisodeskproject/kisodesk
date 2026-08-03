// app/api/ranking/route.ts
// API Route para obtener el ranking de usuarios

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // OBTENER PARÁMETROS DE LA QUERY STRING
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'global';
  const limit = searchParams.get('limit') || '20';
  const offset = searchParams.get('offset') || '0';

  // CONSTRUIR URL DEL BACKEND
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const url = `${backendUrl}/v1/ranking?language=${language}&limit=${limit}&offset=${offset}`;

  // CONSUMIR EL BACKEND Y DEVOLVER RESPUESTA
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch ranking' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
