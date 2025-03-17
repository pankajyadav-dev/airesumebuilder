import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Resume from '../../../../../models/resumeModel';
import { getServerAuthSession } from '../../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../../middleware/cors';
import { jsPDF } from 'jspdf';
import { JSDOM } from 'jsdom';
import html2canvas from 'html2canvas';

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
    
    console.log('PDF Generation: Creating PDF document');
    
    try {
      // Initialize jsPDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Create a virtual DOM to parse the HTML
      const { window } = new JSDOM(htmlContent);
      const document = window.document;
      
      // Extract text content, preserving basic structure
      const content = document.body.textContent || "";
      
      // Set some formatting options
      doc.setFont('helvetica');
      doc.setFontSize(12);
      
      // Add content to PDF with automatic pagination
      const splitText = doc.splitTextToSize(content, 180); // 210mm - margins
      doc.text(splitText, 15, 20);
      
      // Convert to buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      console.log('PDF Generation: PDF created successfully, size:', pdfBuffer.length);
      
      // Return PDF as a downloadable file
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(resume.title || 'Resume')}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
    } catch (pdfError) {
      console.error('PDF Generation: Error creating PDF:', pdfError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to generate PDF', 
          error: pdfError.message,
          stack: process.env.NODE_ENV === 'development' ? pdfError.stack : undefined
        },
        { status: 500 }
      );
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