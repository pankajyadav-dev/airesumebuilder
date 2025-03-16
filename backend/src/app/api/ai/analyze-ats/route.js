import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Resume from '../../../../models/resumeModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function analyzAtsHandler(request) {
  try {
    const session = await getServerAuthSession(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { resumeId, content, jobDescription } = await request.json();
    
    if (!resumeId && !content) {
      return NextResponse.json(
        { success: false, message: 'Either resume ID or content is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    let textToAnalyze = content;
    let resume = null;
    
    if (resumeId) {
      // Get the resume
      resume = await Resume.findOne({
        _id: resumeId,
        userId: session.userId
      });
      
      if (!resume) {
        return NextResponse.json(
          { success: false, message: 'Resume not found' },
          { status: 404 }
        );
      }
      
      textToAnalyze = resume.content;
    }
    
    // Simplified prompt for Gemini API
    const prompt = `Analyze this resume for ATS optimization:
    
    ${textToAnalyze}
    
    ${jobDescription ? `For this job description: ${jobDescription}` : ''}
    
    Provide a JSON response with:
    - score: number from 0-100
    - issues: array of key issues
    - recommendations: array of improvements
    - keywords: array of missing keywords`;
    
    // Mock response for development/testing if Gemini API key is not available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
      const mockAnalysisResult = {
        score: 75,
        issues: [
          "Resume lacks proper keyword density for ATS",
          "Some formatting elements might interfere with parsing",
          "Skills section could be more targeted to job description"
        ],
        recommendations: [
          "Add more industry-specific keywords",
          "Use standard section headings (Experience, Education, Skills)",
          "Ensure bullet points are formatted consistently"
        ],
        keywords: [
          "project management",
          "stakeholder communication",
          "agile methodology",
          "cross-functional teams"
        ]
      };
      
      // Update the resume with the ATS score if resumeId was provided
      if (resume) {
        resume.metrics.atsScore = mockAnalysisResult.score;
        await resume.save();
      }
      
      return NextResponse.json({
        success: true,
        analysis: mockAnalysisResult
      });
    }
    
    try {
      // Initialize the Google Generative AI client
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      // Get the model
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 2048,
        }
      });
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let generatedContent = response.text();
      
      // Extract the JSON part if needed
      if (generatedContent.includes('```json')) {
        generatedContent = generatedContent.split('```json')[1].split('```')[0].trim();
      } else if (generatedContent.includes('```')) {
        generatedContent = generatedContent.split('```')[1].split('```')[0].trim();
      }
      
      // Parse the JSON response
      const analysisResult = JSON.parse(generatedContent);
      
      // Update the resume with the ATS score if resumeId was provided
      if (resume) {
        resume.metrics.atsScore = analysisResult.score;
        await resume.save();
      }
      
      return NextResponse.json({
        success: true,
        analysis: analysisResult
      });
    } catch (error) {
      console.error('Gemini API error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to connect to Gemini API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('ATS analysis error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to analyze resume for ATS optimization' },
      { status: 500 }
    );
  }
}

export const POST = corsMiddleware(analyzAtsHandler);

// Handle OPTIONS for CORS preflight
export function OPTIONS(request) {
  return corsHandler(request);
} 