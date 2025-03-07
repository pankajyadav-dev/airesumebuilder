import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';

async function logoutHandler() {
  try {
    // Clear the token cookie
    cookies().delete('token');
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = corsMiddleware(logoutHandler);

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request) {
  const corsResponse = corsHandler(request);
  if (corsResponse) {
    return corsResponse;
  }
  
  return NextResponse.json({}, { status: 200 });
} 