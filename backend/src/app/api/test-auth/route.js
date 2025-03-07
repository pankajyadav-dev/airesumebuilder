import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { corsMiddleware, corsHandler } from '../../../middleware/cors';

async function testAuthHandler(request) {
  try {
    // Get all cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('All cookies:', allCookies.map(c => c.name));
    
    // Check for token
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      console.log('No token found in cookies');
      return NextResponse.json({
        success: false,
        message: 'No token found',
        cookies: allCookies.map(c => c.name)
      });
    }
    
    // Log token for debugging
    console.log('Token found:', token.substring(0, 10) + '...');
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('Token verified successfully, user ID:', decoded.userId);
      
      return NextResponse.json({
        success: true,
        message: 'Token verified successfully',
        userId: decoded.userId
      });
    } catch (error) {
      console.error('Token verification error:', error.message);
      return NextResponse.json({
        success: false,
        message: 'Invalid token',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

export const GET = corsMiddleware(testAuthHandler);

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request) {
  const corsResponse = corsHandler(request);
  if (corsResponse) {
    return corsResponse;
  }
  
  return NextResponse.json({}, { status: 200 });
} 