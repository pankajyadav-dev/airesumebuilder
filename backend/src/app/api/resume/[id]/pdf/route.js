import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Resume from '../../../../../models/resumeModel';
import { getServerAuthSession } from '../../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../../middleware/cors';
import puppeteer from 'puppeteer';

async function generateResumePdf(request, { params }) {
  try {
    console.log('PDF Generation: Starting process');
    const session = await getServerAuthSession(request);
    
    if (!session) {
      console.log('PDF Generation: Not authenticated');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    console.log('PDF Generation: Processing resume ID:', id);
    
    if (!id) {
      console.log('PDF Generation: Missing resume ID');
      return NextResponse.json(
        { success: false, message: 'Resume ID is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    console.log('PDF Generation: Connected to database');
    
    // Get the resume
    const resume = await Resume.findOne({
      _id: id,
      userId: session.userId
    });
    
    if (!resume) {
      console.log('PDF Generation: Resume not found');
      return NextResponse.json(
        { success: false, message: 'Resume not found' },
        { status: 404 }
      );
    }
    
    console.log('PDF Generation: Resume found, content length:', resume.content.length);
    const htmlContent = resume.content;
    
    if (!htmlContent) {
      console.log('PDF Generation: Resume content is empty');
      return NextResponse.json(
        { success: false, message: 'Resume content is empty' },
        { status: 400 }
      );
    }
    
    // Generate PDF from HTML
    console.log('PDF Generation: Launching Puppeteer');
    let browser;
    try {
      browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      console.log('PDF Generation: Creating new page');
      const page = await browser.newPage();
      
      // Set viewport to A4 size
      await page.setViewport({
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123 // A4 height in pixels at 96 DPI
      });
      
      console.log('PDF Generation: Setting content');
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('PDF Generation: Generating PDF');
      const pdfBuffer = await page.pdf({ 
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      console.log('PDF Generation: PDF generated successfully, size:', pdfBuffer.length);
      
      // Return PDF as a downloadable file
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${resume.title || 'Resume'}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch (puppeteerError) {
      console.error('PDF Generation: Puppeteer error:', puppeteerError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to generate PDF', 
          error: puppeteerError.message,
          stack: process.env.NODE_ENV === 'development' ? puppeteerError.stack : undefined
        },
        { status: 500 }
      );
    } finally {
      if (browser) {
        console.log('PDF Generation: Closing browser');
        await browser.close();
      }
    }
  } catch (error) {
    console.error('PDF Generation: Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate PDF', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const GET = corsMiddleware(generateResumePdf);

// Handle OPTIONS for CORS preflight
export function OPTIONS(request) {
  return corsHandler(request);
} 