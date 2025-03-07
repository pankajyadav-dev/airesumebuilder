import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/userModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';

async function meHandler(request) {
  try {
    const session = await getServerAuthSession(request);
    
    if (!session) {
      console.log('Me API: No valid session found');
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Not authenticated'
      });
    }
    
    console.log('Me API: Session found for user ID:', session.userId);
    
    await connectDB();
    
    // Find the user
    const user = await User.findById(session.userId).select('-password');
    
    if (!user) {
      console.log('Me API: User not found for ID:', session.userId);
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'User not found'
      });
    }
    
    console.log('Me API: User found successfully:', user.email);
    
    // Return user data
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: 'Server error'
    }, { status: 500 });
  }
}

// Apply CORS middleware to the handler
export const GET = corsMiddleware(meHandler);

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request) {
  const corsResponse = corsHandler(request);
  if (corsResponse) {
    return corsResponse;
  }
  
  return NextResponse.json({}, { status: 200 });
}
