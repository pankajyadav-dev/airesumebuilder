import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Resume from '../../../../models/resumeModel';
import User from '../../../../models/userModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';
import nodemailer from 'nodemailer';

async function shareEmailHandler(request) {
  try {
    const session = await getServerAuthSession(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { resumeId, recipientEmail, subject, message } = await request.json();
    
    if (!resumeId || !recipientEmail) {
      return NextResponse.json(
        { success: false, message: 'Resume ID and recipient email are required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Get the resume
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: session.userId
    });
    
    if (!resume) {
      return NextResponse.json(
        { success: false, message: 'Resume not found' },
        { status: 404 }
      );
    }
    
    // Get the user
    const user = await User.findById(session.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Create email transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
    
    // Prepare email content
    const emailSubject = subject || `${user.name} has shared their resume with you`;
    const emailMessage = message || `Hello,\n\n${user.name} has shared their resume with you. Please find it attached.\n\nBest regards,\n${user.name}`;
    
    // Convert HTML content to PDF (simplified for now - in production you'd use a proper HTML to PDF converter)
    const htmlContent = resume.content;
    
    // Send email
    try {
      // For development/testing, just return success without actually sending
      if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
        return NextResponse.json({
          success: true,
          message: 'Email would be sent in production environment',
          mockMode: true
        });
      }
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: emailSubject,
        text: emailMessage,
        html: `<div>
          <p>${emailMessage.replace(/\n/g, '<br>')}</p>
          <div style="margin-top: 20px; padding: 20px; border: 1px solid #eee;">
            ${htmlContent}
          </div>
        </div>`,
        attachments: [
          {
            filename: `${resume.title || 'Resume'}.html`,
            content: htmlContent,
            contentType: 'text/html'
          }
        ]
      });
      
      return NextResponse.json({
        success: true,
        message: 'Resume shared successfully'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json(
        { success: false, message: 'Failed to send email', error: emailError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Share resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to share resume', error: error.message },
      { status: 500 }
    );
  }
}

export const POST = corsMiddleware(shareEmailHandler);

// Handle OPTIONS for CORS preflight
export function OPTIONS(request) {
  return corsHandler(request);
} 