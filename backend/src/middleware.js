import { NextResponse } from 'next/server';

// List of allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// Check if we're in development mode - allow all origins in dev
const isDevelopment = process.env.NODE_ENV !== 'production';

export function middleware(request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    
    // In development, allow all origins, or check against allowlist in production
    if (isDevelopment || allowedOrigins.includes(origin)) {
      return new NextResponse(null, {
        status: 204, // No content
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      });
    }
  }
  
  // For non-OPTIONS requests, add CORS headers to the response
  const response = NextResponse.next();
  const origin = request.headers.get('origin');
  
  // In development, allow all origins, or check against allowlist in production
  if (isDevelopment || allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
}; 