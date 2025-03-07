import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Resume from '../../../../models/resumeModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';
import axios from 'axios';

async function checkPlagiarismHandler(request) {
  try {
    const session = getServerAuthSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { resumeId, content } = await request.json();
    
    // Either resumeId or content must be provided
    if (!resumeId && !content) {
      return NextResponse.json(
        { success: false, message: 'Either resume ID or content is required' },
        { status: 400 }
      );
    }
    
    let textToCheck = content;
    let resume = null;
    
    if (resumeId) {
      await connectDB();
      
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
      
      textToCheck = resume.content;
    }
    
    // Mock response for development/testing if Gemini API key is not available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
      const mockAnalysisResult = {
        score: 82,
        genericSections: [
          {
            text: "Proven track record of success",
            reason: "This is a very common phrase used in many resumes"
          },
          {
            text: "Detail-oriented professional",
            reason: "Generic descriptor that doesn't provide specific value"
          }
        ],
        improvementSuggestions: [
          "Replace generic phrases with specific achievements",
          "Include metrics and numbers to demonstrate impact",
          "Use industry-specific terminology relevant to your field"
        ]
      };
      
      // Update the resume with the plagiarism score if resumeId was provided
      if (resume) {
        resume.metrics.plagiarismScore = mockAnalysisResult.score;
        await resume.save();
      }
      
      return NextResponse.json({
        success: true,
        analysis: mockAnalysisResult
      });
    }
    
    // Prepare prompt for Gemini API
    const prompt = `Check the following resume text for potential plagiarism or generic content:
    
    ${textToCheck}
    
    Please provide:
    1. An originality score from 0-100 (where 100 is completely original)
    2. Identify any sections that appear to be generic or commonly used phrases in resumes
    3. Suggestions for making the content more unique and personalized
    
    Format your response as JSON with the following structure:
    {
      "score": number,
      "genericSections": [
        {
          "text": string,
          "reason": string
        }
      ],
      "improvementSuggestions": [string]
    }`;
    
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
    
    // Update the resume with the plagiarism score if resumeId was provided
    if (resume) {
      resume.metrics.plagiarismScore = analysisResult.score;
      await resume.save();
    }
    
    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Plagiarism check error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check for plagiarism' },
      { status: 500 }
    );
  }
}

export const POST = corsMiddleware(checkPlagiarismHandler);

// Handle OPTIONS for CORS preflight
export function OPTIONS(request) {
  return corsHandler(request);
} 