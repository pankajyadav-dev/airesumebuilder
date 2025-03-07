import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Resume from '../../../../models/resumeModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';

// Get a specific resume
async function getResumeById(request, context) {
  try {
    const session = await getServerAuthSession(request);
    
    if (!session) {
      console.log('Resume API: No valid session found for get by ID');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = context.params.id;
    console.log(`Resume API: Fetching resume ID ${id} for user ID: ${session.userId}`);
    
    await connectDB();
    
    const resume = await Resume.findOne({
      _id: id,
      userId: session.userId
    });
    
    if (!resume) {
      console.log(`Resume API: Resume ID ${id} not found for user ID: ${session.userId}`);
      return NextResponse.json(
        { success: false, message: 'Resume not found' },
        { status: 404 }
      );
    }
    
    console.log(`Resume API: Resume ID ${id} found successfully`);
    return NextResponse.json(resume);
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a specific resume
async function updateResume(request, context) {
  try {
    const session = await getServerAuthSession(request);
    
    if (!session) {
      console.log('Resume API: No valid session found for update');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = context.params.id;
    console.log(`Resume API: Updating resume ID ${id} for user ID: ${session.userId}`);
    
    const { title, content, template, jobTitle, targetCompany, targetIndustry } = await request.json();
    
    await connectDB();
    
    const resume = await Resume.findOne({
      _id: id,
      userId: session.userId
    });
    
    if (!resume) {
      console.log(`Resume API: Resume ID ${id} not found for update`);
      return NextResponse.json(
        { success: false, message: 'Resume not found' },
        { status: 404 }
      );
    }
    
    // Update resume fields
    if (title) resume.title = title;
    if (content) resume.content = content;
    if (template) resume.template = template;
    if (jobTitle) resume.jobTitle = jobTitle;
    if (targetCompany) resume.targetCompany = targetCompany;
    if (targetIndustry) resume.targetIndustry = targetIndustry;
    
    await resume.save();
    console.log(`Resume API: Resume ID ${id} updated successfully`);
    
    return NextResponse.json(resume);
  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a specific resume
async function deleteResume(request, context) {
  try {
    const session = await getServerAuthSession(request);
    
    if (!session) {
      console.log('Resume API: No valid session found for delete');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = context.params.id;
    console.log(`Resume API: Deleting resume ID ${id} for user ID: ${session.userId}`);
    
    await connectDB();
    
    const resume = await Resume.findOne({
      _id: id,
      userId: session.userId
    });
    
    if (!resume) {
      console.log(`Resume API: Resume ID ${id} not found for delete`);
      return NextResponse.json(
        { success: false, message: 'Resume not found' },
        { status: 404 }
      );
    }
    
    await Resume.deleteOne({ _id: id });
    console.log(`Resume API: Resume ID ${id} deleted successfully`);
    
    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply CORS middleware to handlers
export const GET = corsMiddleware(getResumeById);
export const PUT = corsMiddleware(updateResume);
export const DELETE = corsMiddleware(deleteResume);

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request) {
  const corsResponse = corsHandler(request);
  if (corsResponse) {
    return corsResponse;
  }
  
  return NextResponse.json({}, { status: 200 });
} 