import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Resume from '../../../../models/resumeModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function checkGrammarHandler(request) {
  try {
    const session = await getServerAuthSession(request);
    
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
        summary: "This resume is generally well-written with a few grammatical issues. Addressing these minor issues will enhance the overall professionalism of your resume.",
        errors: [
          {
            original: "I am responsible for managing team",
            correction: "I am responsible for managing the team",
            explanation: "Missing article before 'team'"
          },
          {
            original: "Led team of 5 developers",
            correction: "Led a team of 5 developers",
            explanation: "Missing article before 'team'"
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
    
    // Simplified prompt for Gemini API
    const prompt = `Review this resume text for grammar and spelling issues:
    
    ${textToCheck}
    
    Provide a JSON response with:
    - score: grammar score from 0-100
    - summary: a brief overall assessment of the writing quality
    - errors: array of objects with {original, correction, explanation} where original is the problematic text, correction is the suggested fix, and explanation describes the grammar rule or issue
    - styleRecommendations: array of writing style improvement tips specific to resumes
    
    IMPORTANT: Focus on grammar, spelling, clarity, and professional writing standards for resumes.`;
    
    try {
      // Initialize the Google Generative AI client
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      // Get the model
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
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
      
      // Create a clean response with only the essential data
      const cleanAnalysisResult = {
        score: analysisResult.score,
        summary: analysisResult.summary || "",
        errors: analysisResult.errors || [],
        styleRecommendations: analysisResult.styleRecommendations || []
      };
      
      // Update the resume with the grammar score if resumeId was provided
      if (resume) {
        resume.metrics.grammarScore = analysisResult.score;
        await resume.save();
      }
      
      return NextResponse.json({
        success: true,
        analysis: cleanAnalysisResult
      });
    } catch (error) {
      console.error('Gemini API error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to connect to Gemini API' },
        { status: 500 }
      );
    }
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