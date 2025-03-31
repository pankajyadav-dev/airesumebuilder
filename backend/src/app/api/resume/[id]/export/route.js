import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Resume from '../../../../../models/resumeModel';
import { getServerAuthSession } from '../../../../../middleware/auth';
import { corsMiddleware } from '../../../../../middleware/cors';
import HTMLtoDOCX from 'html-to-docx';

async function exportResumeDocument(request, context) {
  try {
    console.log('Document Export: Starting process for template-based export');
    const session = await getServerAuthSession(request);
    
    if (!session) {
      console.log('Document Export: Not authenticated');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const { content, template, format, title } = await request.json();
    
    // Properly await and destructure the params
    const params = await context.params;
    const id = params?.id;
    console.log(`Document Export: Processing resume ID: ${id}, format: ${format}, template: ${template}`);
    
    if (!id) {
      console.log('Document Export: Missing resume ID');
      return NextResponse.json(
        { success: false, message: 'Resume ID is required' },
        { status: 400 }
      );
    }
    
    if (!content) {
      console.log('Document Export: Content is required');
      return NextResponse.json(
        { success: false, message: 'Resume content is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    console.log('Document Export: Connected to database');
    
    // Verify the resume exists and belongs to the user
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
    
    console.log('Document Export: Resume found, content length:', content.length);
    const htmlContent = content;
    
    // Get template-specific styling
    const templateStyles = getTemplateStyles(template);
    
    // Create a complete HTML document with template-specific styling
    const fullHtmlDocument = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title || resume.title || 'Resume'}</title>
        <style>
          ${templateStyles.css}
        </style>
      </head>
      <body class="template-${template}">
        <div class="resume-content">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;
    
    // Return the document in the requested format
    if (format === 'docx') {
      try {
        console.log('Document Export: Converting to DOCX with template:', template);
        
        // Configure document options based on template
        const options = {
          margin: templateStyles.margin,
          title: title || resume.title || 'Resume',
          pageSize: {
            width: 12240, // 8.5 inches
            height: 15840, // 11 inches
          },
          styleMap: templateStyles.styleMap,
          styles: templateStyles.styles,
          table: {
            row: {
              cantSplit: true
            }
          },
          font: templateStyles.font,
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
          const docxBuffer = await Promise.race([conversionPromise, timeoutPromise]);
          
          return new NextResponse(docxBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename="${title || resume.title || 'Resume'}_${template}.docx"`,
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
          'Content-Disposition': `attachment; filename="${title || resume.title || 'Resume'}_${template}.html"`,
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

// Helper function to get template-specific styles
function getTemplateStyles(template) {
  // Default styles (professional template)
  const baseStyleMap = [
    'h1 => Heading1',
    'h2 => Heading2',
    'h3 => Heading3',
    'p => Normal',
    'ul => ListBullet',
    '.resume-content => Normal',
    '* => Normal'
  ];
  
  const baseStyles = {
    paragraphStyles: {
      'Heading1': {
        run: { size: 28, bold: true, color: '#1e3a8a' }, // 14pt
        paragraph: { spacing: { after: 160 } }
      },
      'Heading2': {
        run: { size: 24, bold: true, color: '#1e3a8a' }, // 12pt
        paragraph: { spacing: { before: 240, after: 120 } }
      },
      'Heading3': {
        run: { size: 24, bold: true, color: '#1e3a8a' }, // 12pt
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
  };
  
  // Template-specific configurations
  switch (template) {
    case 'creative':
      return {
        margin: {
          top: 1080, // 0.75 inch
          right: 1080,
          bottom: 1080,
          left: 1080,
        },
        font: 'Calibri',
        styleMap: [
          ...baseStyleMap,
          'div.creative-header => CreativeHeader',
          'div.creative-section => CreativeSection'
        ],
        styles: {
          paragraphStyles: {
            ...baseStyles.paragraphStyles,
            'Heading1': {
              run: { size: 32, bold: true, color: '#9c27b0' }, // 16pt
              paragraph: { spacing: { after: 200 } }
            },
            'Heading2': {
              run: { size: 26, bold: true, color: '#9c27b0' }, // 13pt
              paragraph: { spacing: { before: 240, after: 120 }, border: { bottom: { size: 4, space: 1, value: 'single', color: '#f3e5f5' } } }
            },
            'CreativeHeader': {
              run: { size: 28, bold: false, color: '#666666' },
              paragraph: { spacing: { after: 160 }, alignment: 'center' }
            }
          }
        },
        css: `
          body.template-creative {
            font-family: 'Calibri', sans-serif;
            color: #333;
          }
          .template-creative h1 {
            color: #9c27b0;
            text-align: center;
          }
          .template-creative h2 {
            color: #9c27b0;
            border-bottom: 2px solid #9c27b0;
            display: inline-block;
          }
          .template-creative .skill-tag {
            background-color: #f3e5f5;
            color: #9c27b0;
            padding: 4px 8px;
            border-radius: 10px;
            display: inline-block;
            margin: 3px;
          }
        `
      };
    
    case 'modern':
      return {
        margin: {
          top: 1080, // 0.75 inch
          right: 1080,
          bottom: 1080,
          left: 1080,
        },
        font: 'Arial',
        styleMap: [
          ...baseStyleMap,
          'div.modern-sidebar => ModernSidebar',
          'div.modern-main => ModernMain'
        ],
        styles: {
          paragraphStyles: {
            ...baseStyles.paragraphStyles,
            'Heading1': {
              run: { size: 28, bold: true, color: '#1976d2' }, // 14pt
              paragraph: { spacing: { after: 160 } }
            },
            'Heading2': {
              run: { size: 24, bold: true, color: '#1976d2' }, // 12pt
              paragraph: { spacing: { before: 240, after: 120 }, border: { bottom: { size: 4, space: 1, value: 'single', color: '#1976d2' } } }
            },
            'ModernSidebar': {
              run: { size: 24, color: 'FFFFFF' },
              paragraph: { spacing: { after: 120 }, shading: { fill: '1976d2' } }
            }
          }
        },
        css: `
          body.template-modern {
            font-family: 'Arial', sans-serif;
          }
          .template-modern h1 {
            color: #1976d2;
          }
          .template-modern h2 {
            color: #1976d2;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 5px;
          }
          .template-modern .sidebar {
            background-color: #1976d2;
            color: white;
          }
        `
      };
    
    default: // professional template
      return {
        margin: {
          top: 1440, // 1 inch
          right: 1440,
          bottom: 1440,
          left: 1440,
        },
        font: 'Arial',
        styleMap: baseStyleMap,
        styles: baseStyles,
        css: `
          body.template-professional {
            font-family: 'Arial', sans-serif;
            color: #333;
          }
          .template-professional h1 {
            color: #1e3a8a;
          }
          .template-professional h2 {
            color: #1e3a8a;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .template-professional h3 {
            margin-bottom: 5px;
          }
        `
      };
  }
}

export const POST = corsMiddleware(exportResumeDocument); 