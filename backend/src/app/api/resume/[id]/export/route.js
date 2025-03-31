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
    const requestData = await request.json();
    const { content, template, format, title, options = {} } = requestData;
    
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
    let htmlContent = content;
    
    // Normalize font sizes in the content to ensure consistency
    if (options.fontSize) {
      console.log(`Document Export: Normalizing font sizes to ${options.fontSize}pt`);
      // Replace inline styles with consistent font sizes
      htmlContent = normalizeFontSizes(htmlContent, options.fontSize);
    }
    
    // Get template-specific styling
    const templateStyles = getTemplateStyles(template, options);
    
    // Create a complete HTML document with template-specific styling
    const fullHtmlDocument = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title || resume.title || 'Resume'}</title>
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
        
        // Configure document options based on template and user options
        const docxOptions = {
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
          font: options.fontFamily || templateStyles.font,
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

// Helper function to get template-specific styles
function getTemplateStyles(template, options = {}) {
  const fontSize = options.fontSize || 14;
  const fontSizePoint = fontSize * 2; // Convert to Word's point system (1pt = 2 in Word's internal units)
  
  // Default styles (professional template)
  const baseStyleMap = [
    `h1 => Normal:${fontSizePoint}`,
    `h2 => Normal:${fontSizePoint}`,
    `h3 => Normal:${fontSizePoint}`,
    `p => Normal:${fontSizePoint}`,
    `ul => ListBullet:${fontSizePoint}`,
    `li => ListBullet:${fontSizePoint}`,
    `td => TableCell:${fontSizePoint}`,
    `span => Normal:${fontSizePoint}`,
    `div => Normal:${fontSizePoint}`,
    `.resume-content => Normal:${fontSizePoint}`,
    `* => Normal:${fontSizePoint}`
  ];
  
  const baseStyles = {
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
          'td => TableCell',
          'table => Table',
          'tr => TableRow'
        ],
        styles: {
          paragraphStyles: {
            ...baseStyles.paragraphStyles,
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
          .template-modern table {
            width: 100%;
            border-collapse: collapse;
          }
          .template-modern td:first-child {
            background-color: #1976d2;
            color: white;
            width: 30%;
            vertical-align: top;
          }
          .template-modern td:last-child {
            width: 70%;
            vertical-align: top;
          }
          .template-modern ul {
            padding-left: 20px;
          }
          .template-modern li {
            margin-bottom: 8px;
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