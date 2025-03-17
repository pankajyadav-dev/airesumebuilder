import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Resume from '../../../../../models/resumeModel';
import { getServerAuthSession } from '../../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../../middleware/cors';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

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
    console.log('PDF Generation: Setting up Puppeteer');
    let browser;
    try {
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
        console.log('PDF Generation: Using Chrome from env variable:', process.env.PUPPETEER_EXECUTABLE_PATH);
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
              console.log('PDF Generation: Using Chrome at:', chromePath);
              break;
            }
          } catch (err) {
            console.warn('PDF Generation: Could not check path:', chromePath, err.message);
          }
        }
        
        // If no Chrome found, log warning but attempt to continue
        if (!launchOptions.executablePath) {
          console.warn('PDF Generation: No Chrome installation found. Attempting to use bundled Chromium.');
        }
      }

      console.log('PDF Generation: Launching browser with options:', JSON.stringify({
        headless: launchOptions.headless,
        executablePath: launchOptions.executablePath || 'bundled',
        platform: process.platform
      }));
      
      browser = await puppeteer.launch(launchOptions);
      
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
        console.warn('PDF Generation: Page evaluation issue:', err.message);
      });
      
      // Add a small delay to ensure all rendering is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('PDF Generation: Generating PDF');
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
      
      console.log('PDF Generation: PDF generated successfully, size:', pdfBuffer.length);
      
      // Return PDF as a downloadable file
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${resume.title || 'Resume'}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
    } catch (puppeteerError) {
      console.error('PDF Generation: Puppeteer error:', puppeteerError.message);
      console.error('PDF Generation: Error stack:', puppeteerError.stack);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to generate PDF', 
          error: puppeteerError.message,
          errorType: puppeteerError.name,
          stack: process.env.NODE_ENV === 'development' ? puppeteerError.stack : undefined
        },
        { status: 500 }
      );
    } finally {
      if (browser) {
        console.log('PDF Generation: Closing browser');
        try {
          await browser.close();
        } catch (closeError) {
          console.warn('PDF Generation: Error closing browser:', closeError.message);
        }
      }
    }
  } catch (error) {
    console.error('PDF Generation: Error:', error.message);
    console.error('PDF Generation: Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate PDF', 
        error: error.message,
        errorType: error.name,
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