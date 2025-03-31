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
    
    const requestData = await request.json();
    const { 
      resumeId, 
      recipientEmail, 
      subject, 
      message, 
      documentFormat,
      template: requestTemplate,
      content: requestContent,
      options = {} 
    } = requestData;
    
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
    
    // Use content from the request if provided, otherwise use from the database
    let htmlContent = requestContent || resume.content;

    // Get the template from resume metadata or request
    const template = requestTemplate || resume.template || 'professional';
    console.log('Email Share: Using template:', template);
    
    // Normalize font sizes to ensure consistency before document conversion
    const fontSize = options.fontSize || 14;
    console.log(`Email Share: Normalizing font sizes to ${fontSize}px`);
    htmlContent = normalizeFontSizes(htmlContent, fontSize);
    
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
      </head>
      <body class="template-${template}">
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
        const fontSize = options.fontSize || 14;
        const fontSizePoint = fontSize * 2; // Convert to Word's point system
        
        // Configure document options
        const docxOptions = {
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
            `h1 => Normal:${fontSizePoint}`,
            `h2 => Normal:${fontSizePoint}`,
            `h3 => Normal:${fontSizePoint}`,
            `p => Normal:${fontSizePoint}`,
            `ul => ListBullet:${fontSizePoint}`,
            `li => ListBullet:${fontSizePoint}`,
            `td => TableCell:${fontSizePoint}`,
            `span => Normal:${fontSizePoint}`,
            `div => Normal:${fontSizePoint}`
          ],
          styles: {
            paragraphStyles: {
              'Normal': {
                run: { size: fontSizePoint },
                paragraph: { spacing: { after: 60 } }
              },
              'ListBullet': {
                run: { size: fontSizePoint },
                paragraph: { 
                  spacing: { after: 60 },
                  indent: { left: 720 } // 0.5 inch
                }
              },
              'TableCell': {
                run: { size: fontSizePoint },
                paragraph: { spacing: { after: 60 } }
              }
            }
          },
          table: {
            row: {
              cantSplit: true
            }
          },
          font: options.fontFamily || 'Arial',
          css: false, // Set to false to prevent CSS processing that might cause issues
          preserveCSS: false, // Don't show CSS in document
          formattingPreservingSpace: true,
          lineEnding: '\r'
        };
        
        // Define timeout for conversion
        const CONVERSION_TIMEOUT = 30000; // 30 seconds
        
        // Create promises for conversion and timeout
        const conversionPromise = HTMLtoDOCX(fullHtmlDocument, null, docxOptions);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('DOCX conversion timed out after 30 seconds'));
          }, CONVERSION_TIMEOUT);
        });
        
        // Race the conversion against the timeout
        try {
          attachmentContent = await Promise.race([conversionPromise, timeoutPromise]);
          attachmentFilename = `${resume.title || 'Resume'}_${template}.docx`;
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

// Helper function to normalize font sizes in HTML content
function normalizeFontSizes(html, fontSize = 14) {
  // First, process HTML to make sure all elements have style attributes with font-size
  let processedHtml = html; 
  
  // 1. Replace existing inline font-size values with the consistent fontSize
  processedHtml = processedHtml.replace(/style="([^"]*)font-size:\s*\d+(\.\d+)?(px|pt|em|rem|%)([^"]*)"/gi, 
    `style="$1font-size: ${fontSize}px$4"`);
  
  // 2. Add font-size to elements with style attributes but no font-size
  const elementsToStyle = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'li', 'td', 'th', 'a', 'strong', 'em', 'b', 'i'];
  
  // Process each element type
  elementsToStyle.forEach(tag => {
    // Pattern to match elements with style but no font-size
    const styleNoFontSizePattern = new RegExp(`<${tag}([^>]*?)style="([^"]*?)"([^>]*?)>`, 'gi');
    processedHtml = processedHtml.replace(styleNoFontSizePattern, (match, beforeStyle, styleContent, afterStyle) => {
      if (!styleContent.includes('font-size:')) {
        return `<${tag}${beforeStyle}style="${styleContent}; font-size: ${fontSize}px"${afterStyle}>`;
      }
      return match;
    });
    
    // Pattern to match elements with no style attribute
    const noStylePattern = new RegExp(`<${tag}([^>]*?)>`, 'gi');
    processedHtml = processedHtml.replace(noStylePattern, (match, attributes) => {
      if (!match.includes('style=')) {
        return `<${tag}${attributes} style="font-size: ${fontSize}px">`;
      }
      return match;
    });
  });
  
  // Special handling for headers to maintain hierarchy
  processedHtml = processedHtml.replace(/<h1([^>]*?)style="([^"]*?)"/gi, 
    (match, beforeStyle, styleContent) => {
      const newStyle = styleContent.replace(/font-size:[^;"]*/gi, `font-size: ${Math.min(fontSize * 1.3, 18)}px`);
      if (!newStyle.includes('font-size:')) {
        return `<h1${beforeStyle}style="${newStyle}; font-size: ${Math.min(fontSize * 1.3, 18)}px"`;
      }
      return `<h1${beforeStyle}style="${newStyle}"`;
    });
  
  processedHtml = processedHtml.replace(/<h2([^>]*?)style="([^"]*?)"/gi, 
    (match, beforeStyle, styleContent) => {
      const newStyle = styleContent.replace(/font-size:[^;"]*/gi, `font-size: ${Math.min(fontSize * 1.15, 16)}px`);
      if (!newStyle.includes('font-size:')) {
        return `<h2${beforeStyle}style="${newStyle}; font-size: ${Math.min(fontSize * 1.15, 16)}px"`;
      }
      return `<h2${beforeStyle}style="${newStyle}"`;
    });
  
  return processedHtml;
}

export const POST = corsMiddleware(shareEmailHandler);

// Handle OPTIONS for CORS preflight
export function OPTIONS(request) {
  return corsHandler(request);
}