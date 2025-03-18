import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Resume from '../../../../../models/resumeModel';
import { getServerAuthSession } from '../../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../../middleware/cors';
import HTMLtoDOCX from 'html-to-docx';

async function generateResumeDoc(request, context) {
  try {
    console.log('Document Export: Starting process');
    const session = await getServerAuthSession(request);
    
    if (!session) {
      console.log('Document Export: Not authenticated');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get format from query parameters (default to html)
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'html';
    
    // Properly await and destructure the params
    const params = await context.params;
    const id = params?.id;
    console.log(`Document Export: Processing resume ID: ${id}, format: ${format}`);
    
    if (!id) {
      console.log('Document Export: Missing resume ID');
      return NextResponse.json(
        { success: false, message: 'Resume ID is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    console.log('Document Export: Connected to database');
    
    // Get the resume
    const resume = await Resume.findOne({
      _id: id,
      userId: session.userId
    });
    
    if (!resume) {
      console.log('Document Export: Resume not found');
      return NextResponse.json(
        { success: false, message: 'Resume not found' },
        { status: 404 }
      );
    }
    
    console.log('Document Export: Resume found, content length:', resume.content.length);
    const htmlContent = resume.content;
    
    if (!htmlContent) {
      console.log('Document Export: Resume content is empty');
      return NextResponse.json(
        { success: false, message: 'Resume content is empty' },
        { status: 400 }
      );
    }
    
    // Create a complete HTML document with proper styling
    const fullHtmlDocument = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${resume.title || 'Resume'}</title>
        <style>
          @media print {
            body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            font-size: 12pt;
          }
          
          h1 {
            font-size: 12pt !important;
            font-weight: bold;
            margin-bottom: 16pt;
            color: #0056b3;
          }
          
          h2 {
            font-size: 12pt !important;
            font-weight: bold;
            margin-top: 20pt;
            margin-bottom: 10pt;
            color: #0056b3;
          }
          
          h3 {
            font-size: 12pt !important;
            font-weight: bold;
            margin-bottom: 6pt;
            color: #0056b3;
          }
          
          p {
            font-size: 12pt !important;
            margin-bottom: 6pt;
          }
          
          ul {
            margin-top: 12pt !important;
            margin-bottom: 12pt;
            padding-left: 20pt;
          }
          
          li {
            font-size: 12pt !important; 
            margin-bottom: 4pt;
          }
          
          a {
            color: #007bff;
            text-decoration: none;
            font-size: 12pt !important;
          }
          
          .resume-section {
            margin-bottom: 16pt !important;
          }
          
          /* Force all elements to have the same font size */
          * {
            font-size: 12pt !important;
          }
        </style>
      </head>
      <body>
        <div class="resume-content" style="font-family: Arial, sans-serif;">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;
    
    // Return the document in the requested format
    if (format === 'docx') {
      try {
        console.log('Document Export: Converting to DOCX');
        
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
            // Map HTML styles to Word styles with explicit size
            'h1 => Heading1:24',
            'h2 => Heading2:24',
            'h3 => Heading3:24',
            'p => Normal:24',
            'ul => ListBullet:24',
            '.resume-content => Normal:24'
          ],
          styles: {
            paragraphStyles: {
              'Heading1': {
                run: { size: 24, bold: true, color: '#0056b3' }, // 12pt
                paragraph: { spacing: { after: 160 } }
              },
              'Heading2': {
                run: { size: 24, bold: true, color: '#0056b3' }, // 12pt
                paragraph: { spacing: { before: 240, after: 120 } }
              },
              'Heading3': {
                run: { size: 24, bold: true, color: '#0056b3' }, // 12pt
                paragraph: { spacing: { after: 80 } }
              },
              'Normal': {
                run: { size: 24 }, // 12pt
                paragraph: { spacing: { after: 60 } }
              },
              'ListBullet': {
                run: { size: 24 }, // 12pt
                paragraph: { 
                  spacing: { after: 60 },
                  indent: { left: 720 } // 0.5 inch
                }
              }
            }
          },
          table: {
            row: {
              cantSplit: true
            }
          },
          font: 'Arial',
          css: true, // This tells the library to try to process CSS
          toc: false,
          formattingPreservingSpace: true,
          preserveTextStyles: true
        };
        
        // Process the HTML content to remove any external dependencies
        const processedHtml = fullHtmlDocument
          // Convert any image src with external URLs to base64 or remove them
          .replace(/<img[^>]+src="https?:\/\/[^">]+"[^>]*>/g, match => {
            // Replace with placeholder or remove
            return ''; // Just remove external images to avoid connection issues
          })
          // Force heading sizes to be consistent
          .replace(/<h([1-6])[^>]*style="[^"]*"[^>]*>/g, '<h$1 style="font-size: 12pt !important;">')
          .replace(/<h([1-6])[^>]*>/g, '<h$1 style="font-size: 12pt !important;">');
        
        // Convert HTML to DOCX with a timeout
        const conversionPromise = HTMLtoDOCX(processedHtml, null, {
          ...options,
          externalStylesheets: [], // Don't fetch external stylesheets
          preferCssStyles: true,   // Use CSS from the HTML
          base64Images: false      // Don't fetch and convert images
        });
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Conversion timed out')), 15000); // 15 second timeout
        });
        
        // Race the conversion against the timeout
        try {
          const docxBuffer = await Promise.race([conversionPromise, timeoutPromise]);
          
          return new NextResponse(docxBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename="${resume.title || 'Resume'}.docx"`,
              'Content-Length': docxBuffer.length.toString(),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
          });
        } catch (raceError) {
          console.error('Document Export: Conversion race error:', raceError);
          return NextResponse.json(
            { 
              success: false, 
              message: 'Failed to convert to DOCX', 
              error: raceError.message
            },
            { status: 500 }
          );
        }
      } catch (docxError) {
        console.error('Document Export: DOCX conversion error:', docxError);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to convert to DOCX', 
            error: docxError.message
          },
          { status: 500 }
        );
      }
    } else {
      // Default: return as HTML
      console.log('Document Export: Returning as HTML');
      return new NextResponse(fullHtmlDocument, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${resume.title || 'Resume'}.html"`,
          'Content-Length': fullHtmlDocument.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
    }
  } catch (error) {
    console.error('Document Export: Error:', error.message);
    console.error('Document Export: Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to export document', 
        error: error.message,
        errorType: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const GET = corsMiddleware(generateResumeDoc);

// Handle OPTIONS for CORS preflight
export function OPTIONS(request) {
  return corsHandler(request);
}