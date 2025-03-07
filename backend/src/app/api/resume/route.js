import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Resume from '../../../models/resumeModel';
import { getServerAuthSession } from '../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../middleware/cors';

// Get all resumes for the authenticated user
async function getResumes(request) {
  try {
    const session = await getServerAuthSession(request);
    
    if (!session) {
      console.log('Resume API: No valid session found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('Resume API: Fetching resumes for user ID:', session.userId);
    
    await connectDB();
    
    const resumes = await Resume.find({ userId: session.userId })
      .sort({ updatedAt: -1 })
      .select('title updatedAt metrics template');
    
    console.log(`Resume API: Found ${resumes.length} resumes`);
    
    return NextResponse.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new resume
async function createResume(request) {
  try {
    const session = await getServerAuthSession(request);
    
    if (!session) {
      console.log('Resume API: No valid session found for create');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('Resume API: Creating resume for user ID:', session.userId);
    
    const { title, content, template, jobTitle, targetCompany, targetIndustry } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { success: false, message: 'Resume content is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const newResume = new Resume({
      userId: session.userId,
      title: title || 'Untitled Resume',
      content,
      template: template || 'standard',
      jobTitle,
      targetCompany,
      targetIndustry,
      metrics: {
        atsScore: 0,
        plagiarismScore: 0,
        grammarScore: 0
      }
    });
    
    await newResume.save();
    console.log('Resume API: Resume created successfully');
    
    return NextResponse.json(newResume, { status: 201 });
  } catch (error) {
    console.error('Error creating resume:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply CORS middleware to handlers
export const GET = corsMiddleware(getResumes);
export const POST = corsMiddleware(createResume);

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request) {
  const corsResponse = corsHandler(request);
  if (corsResponse) {
    return corsResponse;
  }
  
  return NextResponse.json({}, { status: 200 });
} 