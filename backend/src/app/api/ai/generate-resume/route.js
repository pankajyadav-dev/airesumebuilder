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
    
    // Enhanced prompt for Gemini API
    const prompt = `Create a professional, ATS-optimized resume for a ${jobTitle} position${targetCompany ? ` at ${targetCompany}` : ''}${targetIndustry ? ` in the ${targetIndustry} industry` : ''}.

I need you to generate a complete resume in HTML format that will pass ATS systems and impress hiring managers. The resume should be tailored specifically for this job and company, highlighting relevant skills and experiences.

Candidate information:
- Name: ${user.name}
- Email: ${user.email}
${hasProfile.personalDetails?.phone ? `- Phone: ${hasProfile.personalDetails.phone}` : ''}
${hasProfile.personalDetails?.address ? `- Address: ${hasProfile.personalDetails.address}` : ''}
${hasProfile.personalDetails?.website ? `- Website: ${hasProfile.personalDetails.website}` : ''}
${hasProfile.personalDetails?.linkedIn ? `- LinkedIn: ${hasProfile.personalDetails.linkedIn}` : ''}
${hasProfile.personalDetails?.github ? `- GitHub: ${hasProfile.personalDetails.github}` : ''}

${hasExperience ? `Work Experience:
${hasProfile.experience.map(exp => `- Position: ${exp.position}
  Company: ${exp.company}
  Duration: ${new Date(exp.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present'}
  Description: ${exp.description || 'Not provided'}`).join('\n\n')}` : ''}

${hasEducation ? `Education:
${hasProfile.education.map(edu => `- Degree: ${edu.degree}
  Field: ${edu.field}
  Institution: ${edu.institution}
  Duration: ${new Date(edu.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})} - ${edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present'}
  Description: ${edu.description || 'Not provided'}`).join('\n\n')}` : ''}

${hasSkills ? `Skills: ${skillsText}` : ''}

${hasProfile.certifications && hasProfile.certifications.length > 0 ? `Certifications:
${certificationsText}` : ''}

${hasProfile.achievements && hasProfile.achievements.length > 0 ? `Achievements:
${achievementsText}` : ''}

Job Details:
- Position: ${jobTitle}
${targetCompany ? `- Company: ${targetCompany}` : ''}
${targetIndustry ? `- Industry: ${targetIndustry}` : ''}

Instructions:
1. Create a professional HTML resume that is well-structured and visually appealing
2. Start with a compelling professional summary that highlights the candidate's value proposition for this specific ${jobTitle} role${targetCompany ? ` at ${targetCompany}` : ''}
3. Organize work experience in reverse chronological order with bullet points highlighting accomplishments and responsibilities relevant to the target position
4. Include education section with degrees, institutions, and graduation dates
5. Highlight relevant skills that match the job requirements
6. Include additional sections (certifications, achievements) if they strengthen the application
7. Use industry-specific keywords throughout the resume to pass ATS screening
8. Create clean, semantic HTML that can be rendered properly in a rich text editor

Your output should be valid HTML that renders as a complete, professional resume. Do not include any non-HTML text in your response, only the HTML code for the resume.

The HTML should follow this structure and use these tags:
- <div> for main container and sections
- <h1> for name
- <h2> for section headers
- <h3> for subsection headers
- <p> for paragraphs
- <ul> and <li> for lists
- <strong> or <b> for emphasis
- Basic inline styling is acceptable for layout

Ensure the resume is ATS-friendly by using standard section headings like "Professional Summary", "Experience", "Education", "Skills", etc IF THERE IS NOT COMPLETE INFORMATION OF USER IS ADDED THEN CREATE IT BY URESELF AND CREATE A standard resume for the same post.`;
    
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