import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/userModel';
import { getServerAuthSession } from '../../../../middleware/auth';
import { corsMiddleware, corsHandler } from '../../../../middleware/cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function generateResumeHandler(request) {
  try {
    const session = await getServerAuthSession(request);
    
    if (!session) {
      console.log('AI Resume API: Not authenticated');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { jobTitle, targetCompany, targetIndustry } = await request.json();
    
    if (!jobTitle) {
      console.log('AI Resume API: Job title missing');
      return NextResponse.json(
        { success: false, message: 'Job title is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Get user profile data
    const user = await User.findById(session.userId);
    
    if (!user) {
      console.log('AI Resume API: User not found');
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if minimal profile data is available
    const hasProfile = user.profile || {};
    const hasExperience = hasProfile.experience && hasProfile.experience.length > 0;
    const hasEducation = hasProfile.education && hasProfile.education.length > 0;
    const hasSkills = hasProfile.skills && hasProfile.skills.length > 0;
    
    // If no profile data available at all, return error with helpful message
    if (!hasProfile || (!hasExperience && !hasEducation && !hasSkills)) {
      console.log('AI Resume API: Insufficient profile data');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Please add some profile data first (education, experience, or skills). Visit your profile page to add this information.',
          missingProfile: true
        },
        { status: 400 }
      );
    }
    
    // Use mock response for development/testing or if Gemini API key is not available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
      console.log('AI Resume API: Using mock response (no API key)');
      
      const mockHtmlContent = `
      <div>
        <h1 style="font-size: 24px; text-align: center; margin-bottom: 10px;">${user.name}</h1>
        ${hasProfile.personalDetails?.email ? `<p style="text-align: center; margin: 0;">${user.email}</p>` : ''}
        ${hasProfile.personalDetails?.phone ? `<p style="text-align: center; margin: 0;">${hasProfile.personalDetails.phone}</p>` : ''}
        ${hasProfile.personalDetails?.address ? `<p style="text-align: center; margin: 0;">${hasProfile.personalDetails.address}</p>` : ''}
        
        <h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Professional Summary</h2>
        <p>Dedicated ${jobTitle} with a strong background in ${hasSkills ? hasProfile.skills.slice(0, 3).join(', ') : 'relevant skills'}. Seeking to leverage my expertise at ${targetCompany || 'a forward-thinking company'} to drive innovation and excellence.</p>
        
        <h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Experience</h2>
        ${hasExperience ? 
          hasProfile.experience.map(exp => `
            <div style="margin-bottom: 15px;">
              <h3 style="font-size: 16px; margin-bottom: 5px;">${exp.position} | ${exp.company}</h3>
              <p style="font-style: italic; margin: 0;">${new Date(exp.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present'}</p>
              <p>${exp.description || 'Responsibilities included project management, team leadership, and strategic planning.'}</p>
            </div>
          `).join('') : 
          '<p>No experience data available. Please update your profile.</p>'
        }
        
        <h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Education</h2>
        ${hasEducation ? 
          hasProfile.education.map(edu => `
            <div style="margin-bottom: 15px;">
              <h3 style="font-size: 16px; margin-bottom: 5px;">${edu.degree} in ${edu.field} | ${edu.institution}</h3>
              <p style="font-style: italic; margin: 0;">${new Date(edu.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})} - ${edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present'}</p>
              <p>${edu.description || ''}</p>
            </div>
          `).join('') : 
          '<p>No education data available. Please update your profile.</p>'
        }
        
        <h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Skills</h2>
        ${hasSkills ? 
          `<ul style="columns: 2;">
            ${hasProfile.skills.map(skill => `<li>${skill}</li>`).join('')}
          </ul>` : 
          '<p>No skills data available. Please update your profile.</p>'
        }
        
        ${hasProfile.certifications && hasProfile.certifications.length > 0 ? 
          `<h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Certifications</h2>
          <ul>
            ${hasProfile.certifications.map(cert => `<li>${cert.name} - ${cert.issuer} (${new Date(cert.date).getFullYear()})</li>`).join('')}
          </ul>` : 
          ''
        }
        
        ${hasProfile.achievements && hasProfile.achievements.length > 0 ? 
          `<h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Achievements</h2>
          <ul>
            ${hasProfile.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
          </ul>` : 
          ''
        }
      </div>
      `;
      
      return NextResponse.json({
        success: true,
        content: mockHtmlContent
      });
    }
    
    // Format education
    const educationText = hasProfile.education && hasProfile.education.length > 0
      ? hasProfile.education.map(edu => 
        `${edu.degree} in ${edu.field} from ${edu.institution} (${new Date(edu.startDate).getFullYear()} - ${edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'})`
      ).join(', ')
      : 'No education information provided';
    
    // Format experience
    const experienceText = hasProfile.experience && hasProfile.experience.length > 0
      ? hasProfile.experience.map(exp => 
        `${exp.position} at ${exp.company} (${new Date(exp.startDate).getFullYear()} - ${exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}): ${exp.description || 'No description provided'}`
      ).join('; ')
      : 'No work experience provided';
    
    // Format skills
    const skillsText = hasProfile.skills && hasProfile.skills.length > 0
      ? hasProfile.skills.join(', ')
      : 'No skills provided';
    
    // Format certifications
    const certificationsText = hasProfile.certifications && hasProfile.certifications.length > 0
      ? hasProfile.certifications.map(cert => 
        `${cert.name} from ${cert.issuer} (${new Date(cert.date).getFullYear()})`
      ).join(', ')
      : '';
    
    // Format achievements
    const achievementsText = hasProfile.achievements && hasProfile.achievements.length > 0
      ? hasProfile.achievements.join('; ')
      : '';
    
    // Simplified prompt for Gemini API
    const prompt = `Create an ATS-optimized HTML resume for ${user.name} applying for ${jobTitle} position${targetCompany ? ` at ${targetCompany}` : ''}${targetIndustry ? ` in ${targetIndustry}` : ''}.

Basic info: ${user.email}${hasProfile.personalDetails?.phone ? `, ${hasProfile.personalDetails.phone}` : ''}${hasProfile.personalDetails?.address ? `, ${hasProfile.personalDetails.address}` : ''}

Experience: ${experienceText}

Education: ${educationText}

Skills: ${skillsText}

${certificationsText ? `Certifications: ${certificationsText}` : ''}
${achievementsText ? `Achievements: ${achievementsText}` : ''}

Create a professional HTML resume with standard sections (Summary, Experience, Education, Skills). Include relevant keywords for ATS optimization. Use semantic HTML tags.`;
    
    try {
      console.log('AI Resume API: Initializing Google Generative AI');
      // Initialize the Google Generative AI client
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      // Get the model - using gemini-2.0-flash for better performance and speed
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 4096,
        }
      });
      
      console.log('AI Resume API: Sending request to Gemini API');
      // Generate content using the updated SDK approach
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let generatedContent = response.text();
      
      // Clean up the response to ensure it's valid HTML
      // Sometimes Gemini might include ```html and ``` markers
      generatedContent = generatedContent.replace(/```html|```/g, '').trim();
      
      // Ensure the content starts with a div if it doesn't already
      if (!generatedContent.trim().startsWith('<div') && !generatedContent.trim().startsWith('<html')) {
        generatedContent = `<div>${generatedContent}</div>`;
      }
      
      console.log('AI Resume API: Successfully generated content');
      return NextResponse.json({
        success: true,
        content: generatedContent
      });
    } catch (apiError) {
      console.error('AI Resume API: Gemini API error:', apiError.message);
      
      // Generate a more structured fallback template based on the available user information
      const fallbackContent = `
      <div>
        <h1 style="font-size: 24px; text-align: center; margin-bottom: 10px;">${user.name}</h1>
        <p style="text-align: center; margin: 0;">${user.email}</p>
        ${hasProfile.personalDetails?.phone ? `<p style="text-align: center; margin: 0;">${hasProfile.personalDetails.phone}</p>` : ''}
        ${hasProfile.personalDetails?.address ? `<p style="text-align: center; margin: 0;">${hasProfile.personalDetails.address}</p>` : ''}
        
        <h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Professional Summary</h2>
        <p>Results-driven ${jobTitle} with ${hasExperience ? `experience in ${hasProfile.experience[0]?.company || 'the industry'}` : 'a strong background'} and expertise in ${hasSkills ? hasProfile.skills.slice(0, 3).join(', ') : 'relevant skills'}. Seeking to leverage my technical and professional skills${targetCompany ? ` at ${targetCompany}` : ''} to drive innovation and deliver outstanding results${targetIndustry ? ` in the ${targetIndustry} industry` : ''}.</p>
        
        <h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Experience</h2>
        ${hasExperience ? 
          hasProfile.experience.map(exp => `
            <div style="margin-bottom: 15px;">
              <h3 style="font-size: 16px; margin-bottom: 5px;">${exp.position} | ${exp.company}</h3>
              <p style="font-style: italic; margin: 0;">${new Date(exp.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present'}</p>
              ${exp.description ? `<p>${exp.description}</p>` : `
              <ul>
                <li>Successfully managed projects and initiatives related to ${jobTitle} responsibilities</li>
                <li>Collaborated with cross-functional teams to achieve organizational objectives</li>
                <li>Applied ${hasSkills ? hasProfile.skills.slice(0, 2).join(' and ') : 'industry best practices'} to improve processes and outcomes</li>
              </ul>`}
            </div>
          `).join('') : 
          `<div style="margin-bottom: 15px;">
            <h3 style="font-size: 16px; margin-bottom: 5px;">${jobTitle} | Previous Company</h3>
            <p style="font-style: italic; margin: 0;">Jan 2020 - Present</p>
            <ul>
              <li>Demonstrated expertise in ${hasSkills ? hasProfile.skills.slice(0, 2).join(' and ') : 'key industry competencies'}</li>
              <li>Managed projects with measurable outcomes and positive results</li>
              <li>Collaborated effectively with stakeholders to ensure project success</li>
            </ul>
          </div>`
        }
        
        <h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Education</h2>
        ${hasEducation ? 
          hasProfile.education.map(edu => `
            <div style="margin-bottom: 15px;">
              <h3 style="font-size: 16px; margin-bottom: 5px;">${edu.degree} in ${edu.field} | ${edu.institution}</h3>
              <p style="font-style: italic; margin: 0;">${new Date(edu.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})} - ${edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present'}</p>
              ${edu.description ? `<p>${edu.description}</p>` : ''}
            </div>
          `).join('') : 
          `<div style="margin-bottom: 15px;">
            <h3 style="font-size: 16px; margin-bottom: 5px;">Degree in Relevant Field | University</h3>
            <p style="font-style: italic; margin: 0;">Aug 2015 - May 2019</p>
          </div>`
        }
        
        <h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Skills</h2>
        ${hasSkills ? 
          `<ul style="columns: 2;">
            ${hasProfile.skills.map(skill => `<li>${skill}</li>`).join('')}
          </ul>` : 
          `<ul style="columns: 2;">
            <li>Communication</li>
            <li>Problem Solving</li>
            <li>Team Leadership</li>
            <li>Project Management</li>
            <li>Strategic Planning</li>
            <li>Data Analysis</li>
          </ul>`
        }
        
        ${hasProfile.certifications && hasProfile.certifications.length > 0 ? 
          `<h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Certifications</h2>
          <ul>
            ${hasProfile.certifications.map(cert => `<li>${cert.name} - ${cert.issuer} (${new Date(cert.date).getFullYear()})</li>`).join('')}
          </ul>` : ''
        }
        
        ${hasProfile.achievements && hasProfile.achievements.length > 0 ? 
          `<h2 style="font-size: 18px; border-bottom: 1px solid #333; margin-top: 20px;">Achievements</h2>
          <ul>
            ${hasProfile.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
          </ul>` : ''
        }
      </div>
      `;
      
      return NextResponse.json({
        success: true,
        content: fallbackContent,
        fallback: true
      });
    }
  } catch (error) {
    console.error('AI Resume API: Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to generate resume with AI', error: error.message },
      { status: 500 }
    );
  }
}

export const POST = corsMiddleware(generateResumeHandler);

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request) {
  const corsResponse = corsHandler(request);
  if (corsResponse) {
    return corsResponse;
  }
  
  return NextResponse.json({}, { status: 200 });
}