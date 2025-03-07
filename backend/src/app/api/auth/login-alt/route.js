import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/userModel';
import { cookies } from 'next/headers';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';

async function loginAltHandler(request) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide email and password' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectDB();
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('Login-alt successful for user:', user.email);
    console.log('Generated token (first 10 chars):', token.substring(0, 10) + '...');
    
    // Create the response with the token directly in the response
    const response = NextResponse.json({
      success: true,
      token: token, // Include token in the response body
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
    
    // Set the cookie directly on the response
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
    });
    
    // Also set a non-httpOnly cookie for client-side access
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: false,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
    });
    
    // Also set a cookie using the cookies() API for extra compatibility
    const cookieStore = cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week 
      sameSite: 'lax',
    });
    
    console.log('Cookies set on response');
    
    return response;
  } catch (error) {
    console.error('Login-alt error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = corsMiddleware(loginAltHandler);

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request) {
  const corsResponse = corsHandler(request);
  if (corsResponse) {
    return corsResponse;
  }
  
  return NextResponse.json({}, { status: 200 });
} 