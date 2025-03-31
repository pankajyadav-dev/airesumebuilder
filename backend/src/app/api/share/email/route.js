import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Resume from '../../../../models/resumeModel';
import User from '../../../../models/userModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';
import nodemailer from 'nodemailer';
import HTMLtoDOCX from 'html-to-docx';

async function shareEmailHandler(request) {
  try {
    console.log('Email Share: Starting process');
    const session = await getServerAuthSession(request);
    
    if (!session) {
      console.log('Email Share: Not authenticated');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { resumeId, recipientEmail, subject, message, documentFormat } = await request.json();
    // Always use DOCX format regardless of what the client sends
    const format = 'docx';
    
    console.log(`Email Share: Processing resume ID: ${resumeId}, to recipient: ${recipientEmail}, format: ${format}`);
    
    if (!resumeId || !recipientEmail) {
      console.log('Email Share: Missing required parameters');
      return NextResponse.json(
        { success: false, message: 'Resume ID and recipient email are required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    console.log('Email Share: Connected to database');
    
    // Get the resume
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: session.userId
    });
    
    if (!resume) {
      console.log('Email Share: Resume not found');
      return NextResponse.json(
        { success: false, message: 'Resume not found' },
        { status: 404 }
      );
    }
    
    // Get the user
    const user = await User.findById(session.userId);
    
    if (!user) {
      console.log('Email Share: User not found');
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
    
    // Create a complete HTML document with proper styling
    const htmlContent = resume.content;

    // Get the template from resume metadata
    const template = resume.template || 'professional';
    console.log('Email Share: Using template:', template);
    
    // Preserve inline styles by wrapping content in a style-preserving container
    const processedHtmlContent = `
      <div class="resume-content template-${template}">
        ${htmlContent}
      </div>
    `;
    
    // Create a complete HTML document with proper styling
    const fullHtmlDocument = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${resume.title || 'Resume'}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .template-professional h1 { color: #1e3a8a; }
          .template-professional h2 { color: #1e3a8a; border-bottom: 1px solid #ddd; }
          .template-creative h1 { color: #9c27b0; }
          .template-creative h2 { color: #9c27b0; border-bottom: 2px solid #9c27b0; }
          .template-modern h1 { color: #1976d2; }
          .template-modern h2 { color: #1976d2; border-bottom: 2px solid #1976d2; }
          .template-modern table { width: 100%; border-collapse: collapse; }
          .template-modern td:first-child { background-color: #1976d2; color: white; width: 30%; }
          .template-modern td:last-child { width: 70%; }
        </style>
      </head>
      <body>
        ${processedHtmlContent}
      </body>
      </html>
    `;
    
    // Prepare email content
    const emailSubject = subject || `${user.name} has shared their resume with you`;
    const emailMessage = message || `Hello,\n\n${user.name} has shared their resume with you. You can view the resume content below or in the attached file.\n\nBest regards,\n${user.name}`;
    
    // Send email
    try {
      // For development/testing, just return success without actually sending
      if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
        console.log('Email Share: Mock mode enabled, not sending actual email');
        return NextResponse.json({
          success: true,
          message: 'Email would be sent in production environment',
          mockMode: true
        });
      }
      
      let attachmentContent, attachmentFilename, attachmentContentType;
      
      // Always use DOCX format
      console.log('Email Share: Converting to DOCX for email attachment');
      try {
        // Configure document options
        const options = {
          margin: {
            top: 1440, // 1 inch in twip
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
          title: resume.title || 'Resume',
          pageSize: {
            width: 12240, // A4 width in twip (8.5 inches)
            height: 15840, // A4 height in twip (11 inches)
          },
          styleMap: [
            'h1 => Heading1:28',
            'h2 => Heading2:28',
            'h3 => Heading3:28',
            'p => Normal:28',
            'ul => ListBullet:28',
            'li => ListBullet:28',
            'td => TableCell:28',
            'table => Table',
            'tr => TableRow',
            '.resume-content => Normal:28',
            '* => Normal:28'
          ],
          styles: {
            paragraphStyles: {
              'Heading1': {
                run: { size: 28, bold: true }, // 14pt
                paragraph: { spacing: { after: 160 } }
              },
              'Heading2': {
                run: { size: 28, bold: true }, // 14pt
                paragraph: { spacing: { before: 240, after: 120 } }
              },
              'Heading3': {
                run: { size: 28, bold: true }, // 14pt
                paragraph: { spacing: { after: 80 } }
              },
              'Normal': {
                run: { size: 28 }, // 14pt
                paragraph: { spacing: { after: 60 } }
              },
              'ListBullet': {
                run: { size: 28 }, // 14pt
                paragraph: { 
                  spacing: { after: 60 },
                  indent: { left: 720 } // 0.5 inch
                }
              },
              'TableCell': {
                run: { size: 28 }, // 14pt
                paragraph: { spacing: { after: 60 } }
              }
            }
          },
          table: {
            row: {
              cantSplit: true
            }
          },
          font: 'Arial',
          css: true, // Process CSS
          formattingPreservingSpace: true
        };
        
        // Define timeout for conversion
        const CONVERSION_TIMEOUT = 30000; // 30 seconds
        
        // Create promises for conversion and timeout
        const conversionPromise = HTMLtoDOCX(fullHtmlDocument, null, options);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('DOCX conversion timed out after 30 seconds'));
          }, CONVERSION_TIMEOUT);
        });
        
        // Race the conversion against the timeout
        try {
          attachmentContent = await Promise.race([conversionPromise, timeoutPromise]);
          attachmentFilename = `${resume.title || 'Resume'}.docx`;
          attachmentContentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } catch (raceError) {
          console.error('Email Share: Conversion race error:', raceError);
          return NextResponse.json(
            { success: false, message: 'Failed to convert to DOCX', error: raceError.message },
            { status: 500 }
          );
        }
      } catch (docxError) {
        console.error('Email Share: DOCX conversion error:', docxError);
        return NextResponse.json(
          { success: false, message: 'Failed to convert to DOCX for email', error: docxError.message },
          { status: 500 }
        );
      }
      
      // Send the email with the DOCX attachment
      console.log('Email Share: Sending email to:', recipientEmail);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: emailSubject,
        text: emailMessage,
        html: `<div><p>${emailMessage.replace(/\n/g, '<br>')}</p></div>`,
        attachments: [
          {
            filename: attachmentFilename,
            content: attachmentContent,
            contentType: attachmentContentType
          }
        ]
      });
      
      console.log('Email Share: Email sent successfully');
      return NextResponse.json({
        success: true,
        message: 'Resume shared successfully'
      });
    } catch (emailError) {
      console.error('Email Share: Error sending email:', emailError.message);
      return NextResponse.json(
        { success: false, message: 'Failed to send email', error: emailError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email Share: Error:', error.message);
    console.error('Email Share: Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to share resume by email', 
        error: error.message,
        errorType: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const POST = corsMiddleware(shareEmailHandler);

// Handle OPTIONS for CORS preflight
export function OPTIONS(request) {
  return corsHandler(request);
}