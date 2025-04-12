import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/proxy/', '');
    const queryString = url.search;
    
    
    const backendUrl = `${BACKEND_URL}/${path}${queryString}`;
    console.log(`Proxying request to: ${backendUrl}`);
    
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    
    if (!response.ok) {
      console.error(`Backend returned error ${response.status}: ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch data: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching data from the backend' },
      { status: 500 }
    );
  }
} 