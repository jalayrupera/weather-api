import { NextRequest, NextResponse } from 'next/server';

// Environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

// API route handler for all proxy paths
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { path } = await context.params;
    const pathString = Array.isArray(path) ? path.join('/') : '';
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendUrl = `${BACKEND_URL}/${pathString}${queryString ? `?${queryString}` : ''}`;
    
    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache API responses
    });

    // If the response is not ok, throw an error
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
    }

    // Parse the response as JSON
    const data = await response.json();

    // Return the data
    return NextResponse.json(data);
  } catch (error) {
    // Return an error response
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 