import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/userModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';

// Get user profile
async function getProfileHandler(request) {
  try {
    const session = await getServerAuthSession(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Find the user
    const user = await User.findById(session.userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user profile data
    return NextResponse.json({
      success: true,
      id: user._id,
      name: user.name,
      email: user.email,
      profile: user.profile || {
        personalDetails: {},
        education: [],
        experience: [],
        skills: [],
        certifications: [],
        achievements: []
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user profile
async function updateProfileHandler(request) {
  try {
    const session = await getServerAuthSession(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { name, profile } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Find the user
    const user = await User.findById(session.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user data
    user.name = name;
    
    // Ensure profile structure is maintained
    user.profile = {
      personalDetails: profile.personalDetails || {},
      education: profile.education || [],
      experience: profile.experience || [],
      skills: profile.skills || [],
      certifications: profile.certifications || [],
      achievements: profile.achievements || []
    };
    
    await user.save();
    
    // Return updated user profile data
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = corsMiddleware(getProfileHandler);
export const PUT = corsMiddleware(updateProfileHandler);

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request) {
  const corsResponse = corsHandler(request);
  if (corsResponse) {
    return corsResponse;
  }
  
  return NextResponse.json({}, { status: 200 });
} 