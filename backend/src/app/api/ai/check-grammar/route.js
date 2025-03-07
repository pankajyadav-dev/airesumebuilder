import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Resume from '../../../../models/resumeModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';
import axios from 'axios';

async function checkGrammarHandler(request) {
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
        score: 85,
        errors: [
          {
            original: "I am responsible for managing team",
            correction: "I am responsible for managing the team",
            explanation: "Missing article 'the' before 'team'"
          },
          {
            original: "We completed the project under budget",
            correction: "We completed the project under budget",
            explanation: "No error detected"
          }
        ],
        styleRecommendations: [
          "Use active voice instead of passive voice",
          "Be concise and avoid redundancy",
          "Use strong action verbs at the beginning of bullet points"
        ]
      };
      
      // Update the resume with the grammar score if resumeId was provided
      if (resume) {
        resume.metrics.grammarScore = mockAnalysisResult.score;
        await resume.save();
      }
      
      return NextResponse.json({
        success: true,
        analysis: mockAnalysisResult
      });
    }
    
    // Prepare prompt for Gemini API
    const prompt = `Check the following resume text for grammar and spelling errors:
    
    ${textToCheck}
    
    Please provide:
    1. An overall grammar score from 0-100
    2. A list of grammar and spelling errors found
    3. Suggested corrections for each error
    4. General writing style recommendations
    
    Format your response as JSON with the following structure:
    {
      "score": number,
      "errors": [
        {
          "original": string,
          "correction": string,
          "explanation": string
        }
      ],
      "styleRecommendations": [string]
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
    
    // Update the resume with the grammar score if resumeId was provided
    if (resume) {
      resume.metrics.grammarScore = analysisResult.score;
      await resume.save();
    }
    
    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Grammar check error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check grammar and spelling' },
      { status: 500 }
    );
  }
}

export const POST = corsMiddleware(checkGrammarHandler);

// Handle OPTIONS for CORS preflight
export function OPTIONS(request) {
  return corsHandler(request);
} 