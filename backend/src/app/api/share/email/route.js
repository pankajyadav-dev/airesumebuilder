import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Resume from '../../../../models/resumeModel';
import User from '../../../../models/userModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';
import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';
import fs from 'fs';

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
    
    const { resumeId, recipientEmail, subject, message } = await request.json();
    console.log('Email Share: Processing resume ID:', resumeId, 'to recipient:', recipientEmail);
    
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
    
    // Prepare email content
    const emailSubject = subject || `${user.name} has shared their resume with you`;
    const emailMessage = message || `Hello,\n\n${user.name} has shared their resume with you. Please find it attached as a PDF.\n\nBest regards,\n${user.name}`;
    
    // Convert HTML content to PDF (simplified for now - in production you'd use a proper HTML to PDF converter)
    const htmlContent = resume.content;
    
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
      
      console.log('Email Share: Setting up Puppeteer for PDF generation');
      let browser;
      
      // Configure Puppeteer launch options
      const launchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--disable-accelerated-2d-canvas',
          '--disable-infobars',
          '--window-size=1920,1080'
        ]
      };

      // Use environment variable if provided
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        console.log('Email Share: Using Chrome from env variable:', process.env.PUPPETEER_EXECUTABLE_PATH);
      }
      // Otherwise detect Chrome on Windows
      else if (process.platform === 'win32') {
        const possiblePaths = [
          // Standard Chrome locations
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
          
          // Edge as a fallback (compatible with Puppeteer)
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
          
          // Chrome Beta/Dev/Canary versions
          process.env.LOCALAPPDATA + '\\Google\\Chrome Beta\\Application\\chrome.exe',
          process.env.LOCALAPPDATA + '\\Google\\Chrome Dev\\Application\\chrome.exe',
          process.env.LOCALAPPDATA + '\\Google\\Chrome SxS\\Application\\chrome.exe',
        ];

        for (const chromePath of possiblePaths) {
          try {
            if (fs.existsSync(chromePath)) {
              launchOptions.executablePath = chromePath;
              console.log('Email Share: Using Chrome at:', chromePath);
              break;
            }
          } catch (err) {
            console.warn('Email Share: Could not check path:', chromePath, err.message);
          }
        }
        
        // If no Chrome found, log warning but attempt to continue
        if (!launchOptions.executablePath) {
          console.warn('Email Share: No Chrome installation found. Attempting to use bundled Chromium.');
        }
      }

      console.log('Email Share: Launching browser with options:', JSON.stringify({
        headless: launchOptions.headless,
        executablePath: launchOptions.executablePath || 'bundled',
        platform: process.platform
      }));
      
      try {
        browser = await puppeteer.launch(launchOptions);
        
        console.log('Email Share: Creating new page');
        const page = await browser.newPage();
        
        // Set viewport to A4 size
        await page.setViewport({
          width: 794, // A4 width in pixels at 96 DPI
          height: 1123 // A4 height in pixels at 96 DPI
        });
        
        console.log('Email Share: Setting content');
        await page.setContent(htmlContent, { 
          waitUntil: 'networkidle0',
          timeout: 60000 // Increased timeout to 60 seconds
        });
        
        // Wait for any images to load
        await page.evaluate(() => {
          return new Promise((resolve) => {
            // If page is already loaded, resolve immediately
            if (document.readyState === 'complete') {
              resolve();
              return;
            }
            
            // Otherwise wait for load event
            window.addEventListener('load', resolve);
            
            // Set a backup timeout in case load event doesn't fire
            setTimeout(resolve, 10000);
            
            // Try to load all images
            Array.from(document.images).forEach(img => {
              if (!img.complete) {
                img.onload = function() {};
                img.onerror = function() {};
              }
            });
          });
        }).catch(err => {
          console.warn('Email Share: Page evaluation issue:', err.message);
        });
        
        // Add a small delay to ensure all rendering is complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Email Share: Generating PDF');
        const pdfBuffer = await page.pdf({ 
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          },
          timeout: 60000 // 60 seconds timeout for PDF generation
        });
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
          throw new Error('Generated PDF is empty');
        }
        
        console.log('Email Share: PDF generated successfully, size:', pdfBuffer.length);
        
        console.log('Email Share: Sending email to:', recipientEmail);
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipientEmail,
          subject: emailSubject,
          text: emailMessage,
          html: `<div>
            <p>${emailMessage.replace(/\n/g, '<br>')}</p>
          </div>`,
          attachments: [
            {
              filename: `${resume.title || 'Resume'}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        });
        
        console.log('Email Share: Email sent successfully');
        return NextResponse.json({
          success: true,
          message: 'Resume shared successfully'
        });
      } finally {
        if (browser) {
          console.log('Email Share: Closing browser');
          try {
            await browser.close();
          } catch (closeError) {
            console.warn('Email Share: Error closing browser:', closeError.message);
          }
        }
      }
    } catch (emailError) {
      console.error('Email Share: Email sending error:', emailError.message);
      console.error('Email Share: Error stack:', emailError.stack);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to send email', 
          error: emailError.message,
          errorType: emailError.name,
          stack: process.env.NODE_ENV === 'development' ? emailError.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email Share: Error:', error.message);
    console.error('Email Share: Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to share resume', 
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