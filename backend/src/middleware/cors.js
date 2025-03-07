import { NextResponse } from 'next/server';

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// Check if we're in development mode - allow all origins in dev
const isDevelopment = process.env.NODE_ENV !== 'production';

export function corsMiddleware(handler) {
  return async (request, ...args) => {
    // For OPTIONS requests, return CORS headers immediately
    if (request.method === 'OPTIONS') {
      return handleCorsOptions(request);
    }
    
    // Handle the request
    let response;
    
    try {
      response = await handler(request, ...args);
    } catch (error) {
      console.error('Error in handler:', error);
      response = new NextResponse(
        JSON.stringify({ success: false, message: 'Internal server error' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // No response was returned
    if (!response) {
      response = new NextResponse(
        JSON.stringify({ success: false, message: 'No response from handler' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // Set CORS headers
    if (response instanceof NextResponse) {
      const origin = request.headers.get('origin');
      
      // In development, allow all origins, or check against allowlist in production
      if (isDevelopment || allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
      }
    }
    
    return response;
  };
}

// Handle OPTIONS requests with proper CORS headers
function handleCorsOptions(request) {
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
  
  return new NextResponse(null, { status: 204 });
}

// ✅ Ensure OPTIONS requests return correct CORS headers
export function corsHandler(request) {
  if (request.method === 'OPTIONS') {
    return handleCorsOptions(request);
  }
  
  return null;
}
