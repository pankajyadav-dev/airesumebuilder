import { NextResponse } from 'next/server';
import { corsMiddleware, corsHandler } from '../../../middleware/cors';

async function healthCheckHandler() {
  return NextResponse.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
}

export const GET = corsMiddleware(healthCheckHandler);

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request) {
  return corsHandler(request) || new NextResponse(null, { status: 204 });
} 