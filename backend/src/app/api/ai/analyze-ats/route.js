import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Resume from '../../../../models/resumeModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';
import axios from 'axios';

async function analyzAtsHandler(request) {
  try {
    const session = getServerAuthSession();
    
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
    
    // Prepare prompt for Gemini API
    const prompt = `Analyze this resume for ATS (Applicant Tracking System) optimization:
    
    ${textToAnalyze}
    
    ${jobDescription ? `For this job description: ${jobDescription}` : ''}
    
    Please provide:
    1. An overall ATS score from 0-100
    2. Key issues that might prevent the resume from passing ATS filters
    3. Specific recommendations to improve ATS compatibility
    4. Important keywords that should be included based on the job description
    5. Format and structure recommendations
    
    Format your response as JSON with the following structure:
    {
      "score": number,
      "issues": [string],
      "recommendations": [string],
      "keywords": [string],
      "formatRecommendations": [string]
    }`;
    
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
        ],
        formatRecommendations: [
          "Use standard section headings",
          "Avoid tables, headers/footers, and columns",
          "Use standard bullet points instead of custom symbols"
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
    
    // Call Gemini API
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        }
      }
    );
    
    // Extract the generated content from Gemini API response
    const generatedContent = response.data.candidates[0].content.parts[0].text;
    
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