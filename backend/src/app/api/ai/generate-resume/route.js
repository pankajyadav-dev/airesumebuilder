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
    
    // Check if profile data is available
    const hasProfile = user.profile || {};
    const hasExperience = hasProfile.experience && hasProfile.experience.length > 0;
    const hasEducation = hasProfile.education && hasProfile.education.length > 0;
    const hasSkills = hasProfile.skills && hasProfile.skills.length > 0;
    
    // Even if the user has no profile data, we'll generate a resume with default content
    // instead of returning an error
    
    // Use mock response for development/testing or if Gemini API key is not available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
      console.log('AI Resume API: Using mock response (no API key)');
      
      const mockHtmlContent = generateDefaultResumeContent(user, jobTitle, targetCompany, targetIndustry, hasProfile, hasExperience, hasEducation, hasSkills);
      
      return NextResponse.json({
        success: true,
        content: mockHtmlContent
      });
    }
    
    // Create a user data object with all available information
    const userData = {
      name: user.name,
      email: user.email,
      phone: hasProfile.personalDetails?.phone || '',
      address: hasProfile.personalDetails?.address || '',
      website: hasProfile.personalDetails?.website || '',
      linkedin: hasProfile.personalDetails?.linkedIn || '',
      github: hasProfile.personalDetails?.github || '',
      experience: hasExperience ? formatExperienceForPrompt(hasProfile.experience) : [],
      education: hasEducation ? formatEducationForPrompt(hasProfile.education) : [],
      skills: hasSkills ? hasProfile.skills : [],
      certifications: hasProfile.certifications || [],
      achievements: hasProfile.achievements || [],
      summary: generateDefaultSummary(user.name, jobTitle, targetCompany, targetIndustry, hasProfile)
    };
    
    // Construct prompt based on available user data
    const prompt = constructResumePrompt(userData, jobTitle, targetCompany, targetIndustry);
    
    try {
      console.log('AI Resume API: Initializing Google Generative AI');
      // Initialize the Google Generative AI client
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      // Get the model - using gemini-2.0-flash for better performance and speed
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.3,
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
      
      // Generate a fallback template with the available user information
      const fallbackContent = generateDefaultResumeContent(user, jobTitle, targetCompany, targetIndustry, hasProfile, hasExperience, hasEducation, hasSkills);
      
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

// Helper function to format experience for the prompt
function formatExperienceForPrompt(experience) {
  return experience.map(exp => ({
    company: exp.company,
    position: exp.position,
    startDate: new Date(exp.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}),
    endDate: exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present',
    description: exp.description || ''
  }));
}

// Helper function to format education for the prompt
function formatEducationForPrompt(education) {
  return education.map(edu => ({
    institution: edu.institution,
    degree: edu.degree,
    field: edu.field,
    startDate: new Date(edu.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}),
    endDate: edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present',
    description: edu.description || ''
  }));
}

// Helper function to generate a default summary
function generateDefaultSummary(name, jobTitle, targetCompany, targetIndustry, profile) {
  const hasSkills = profile.skills && profile.skills.length > 0;
  const skillsText = hasSkills ? profile.skills.slice(0, 3).join(', ') : 'relevant technical and professional skills';
  
  return `Results-driven ${jobTitle} with expertise in ${skillsText}. Dedicated to delivering high-quality results${targetCompany ? ` at ${targetCompany}` : ''}${targetIndustry ? ` in the ${targetIndustry} industry` : ''}.`;
}

// Helper function to construct a detailed resume generation prompt
function constructResumePrompt(userData, jobTitle, targetCompany, targetIndustry) {
  let prompt = `Create a professional, ATS-optimized HTML resume for ${userData.name} who is applying for a ${jobTitle} position`;
  
  if (targetCompany) {
    prompt += ` at ${targetCompany}`;
  }
  
  if (targetIndustry) {
    prompt += ` in the ${targetIndustry} industry`;
  }
  
  prompt += '.\n\n';
  
  // Add contact information
  prompt += 'CONTACT INFORMATION:\n';
  prompt += `Name: ${userData.name}\n`;
  prompt += `Email: ${userData.email}\n`;
  if (userData.phone) prompt += `Phone: ${userData.phone}\n`;
  if (userData.address) prompt += `Location: ${userData.address}\n`;
  if (userData.website) prompt += `Website: ${userData.website}\n`;
  if (userData.linkedin) prompt += `LinkedIn: ${userData.linkedin}\n`;
  if (userData.github) prompt += `GitHub: ${userData.github}\n`;
  
  // Add summary
  prompt += '\nPROFESSIONAL SUMMARY:\n';
  prompt += userData.summary + '\n';
  
  // Add experience
  prompt += '\nEXPERIENCE:\n';
  if (userData.experience.length > 0) {
    userData.experience.forEach(exp => {
      prompt += `Position: ${exp.position}\n`;
      prompt += `Company: ${exp.company}\n`;
      prompt += `Duration: ${exp.startDate} - ${exp.endDate}\n`;
      if (exp.description) prompt += `Description: ${exp.description}\n`;
      prompt += '\n';
    });
  } else {
    prompt += 'No previous experience provided. Include a section with relevant experience for a ' + jobTitle + ' role.\n';
  }
  
  // Add education
  prompt += '\nEDUCATION:\n';
  if (userData.education.length > 0) {
    userData.education.forEach(edu => {
      prompt += `Degree: ${edu.degree} in ${edu.field}\n`;
      prompt += `Institution: ${edu.institution}\n`;
      prompt += `Duration: ${edu.startDate} - ${edu.endDate}\n`;
      if (edu.description) prompt += `Description: ${edu.description}\n`;
      prompt += '\n';
    });
  } else {
    prompt += 'No education information provided. Include a section with relevant education for a ' + jobTitle + ' role.\n';
  }
  
  // Add skills
  prompt += '\nSKILLS:\n';
  if (userData.skills.length > 0) {
    prompt += userData.skills.join(', ') + '\n';
  } else {
    prompt += 'No skills provided. Include relevant skills for a ' + jobTitle + ' role.\n';
  }
  
  // Add certifications if available
  if (userData.certifications.length > 0) {
    prompt += '\nCERTIFICATIONS:\n';
    userData.certifications.forEach(cert => {
      prompt += `${cert.name} from ${cert.issuer} (${new Date(cert.date).getFullYear()})\n`;
    });
  }
  
  // Add achievements if available
  if (userData.achievements.length > 0) {
    prompt += '\nACHIEVEMENTS:\n';
    userData.achievements.forEach(achievement => {
      prompt += `- ${achievement}\n`;
    });
  }
  
  // Instructions for HTML creation
  prompt += `\nCREATE A BEAUTIFUL MODERN HTML RESUME WITH THE FOLLOWING SPECIFICATIONS:
1. Use clean, professional HTML formatting with inline CSS
2. Create a modern, visually appealing design with appropriate spacing and typography
3. Include all the sections mentioned above, with appropriate headers and formatting
4. Make the resume ATS-friendly by using standard section headers and including relevant keywords for a ${jobTitle} position
5. Use bullet points for experience, skills, and achievements to improve readability
6. If any information is missing, create reasonable placeholder content based on the ${jobTitle} role${targetIndustry ? ` in ${targetIndustry}` : ''}
7. Include quantifiable achievements and metrics where possible
8. Format the HTML to be easily printable and professional-looking
9. Use a modern color scheme that is professional but distinctive`;

  return prompt;
}

// Helper function to generate default resume content
function generateDefaultResumeContent(user, jobTitle, targetCompany, targetIndustry, hasProfile, hasExperience, hasEducation, hasSkills) {
  // Generate job-specific default skills if the user has none
  const defaultSkills = generateDefaultSkills(jobTitle, targetIndustry);
  
  return `
<div style="font-family: 'Roboto', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; line-height: 1.5; background: #fff; box-shadow: 0 1px 5px rgba(0,0,0,0.1);">
  <div class="header" style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3b82f6;">
    <h1 style="margin: 0 0 10px; font-size: 32px; color: #1e40af; font-weight: 700;">${user.name}</h1>
    <p style="margin: 0; color: #4b5563; font-size: 16px;">
      ${user.email}
      ${hasProfile.personalDetails?.phone ? ` | ${hasProfile.personalDetails.phone}` : ''}
      ${hasProfile.personalDetails?.address ? ` | ${hasProfile.personalDetails.address}` : ''}
      ${hasProfile.personalDetails?.website ? ` | <a href="${hasProfile.personalDetails.website}" style="color: #3b82f6; text-decoration: none;">Portfolio</a>` : ''}
      ${hasProfile.personalDetails?.linkedIn ? ` | <a href="${hasProfile.personalDetails.linkedIn}" style="color: #3b82f6; text-decoration: none;">LinkedIn</a>` : ''}
      ${hasProfile.personalDetails?.github ? ` | <a href="${hasProfile.personalDetails.github}" style="color: #3b82f6; text-decoration: none;">GitHub</a>` : ''}
    </p>
  </div>
  
  <div class="section" style="margin-bottom: 25px;">
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 15px; padding-bottom: 8px; color: #1e40af; border-bottom: 1px solid #e5e7eb;">Professional Summary</h2>
    <p style="margin: 0; font-size: 16px; color: #4b5563;">${generateDefaultSummary(user.name, jobTitle, targetCompany, targetIndustry, hasProfile)}</p>
  </div>
  
  <div class="section" style="margin-bottom: 25px;">
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 15px; padding-bottom: 8px; color: #1e40af; border-bottom: 1px solid #e5e7eb;">Experience</h2>
    ${hasExperience ? 
      hasProfile.experience.map(exp => `
        <div class="job" style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">${exp.position}</h3>
            <span style="font-style: italic; color: #6b7280;">${new Date(exp.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present'}</span>
          </div>
          <p class="company" style="margin: 0 0 10px; font-weight: 500; color: #4b5563;">${exp.company}</p>
          ${exp.description ? 
            `<p style="margin: 10px 0; color: #4b5563;">${exp.description}</p>` : 
            `<ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563;">
              <li style="margin-bottom: 8px;">Led initiatives to improve ${generateRelevantTask(jobTitle, 1)}</li>
              <li style="margin-bottom: 8px;">Collaborated with cross-functional teams to ${generateRelevantTask(jobTitle, 2)}</li>
              <li style="margin-bottom: 8px;">Successfully implemented strategies resulting in ${generateRelevantTask(jobTitle, 3)}</li>
            </ul>`
          }
        </div>
      `).join('') : 
      generateDefaultExperience(jobTitle, targetIndustry)
    }
  </div>
  
  <div class="section" style="margin-bottom: 25px;">
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 15px; padding-bottom: 8px; color: #1e40af; border-bottom: 1px solid #e5e7eb;">Education</h2>
    ${hasEducation ? 
      hasProfile.education.map(edu => `
        <div class="education" style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">${edu.degree} in ${edu.field}</h3>
            <span style="font-style: italic; color: #6b7280;">${new Date(edu.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})} - ${edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present'}</span>
          </div>
          <p style="margin: 0; color: #4b5563;">${edu.institution}</p>
          ${edu.description ? `<p style="margin: 5px 0 0; color: #6b7280;">${edu.description}</p>` : ''}
        </div>
      `).join('') : 
      `<div class="education" style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">${generateDefaultDegree(jobTitle)} in ${generateDefaultField(jobTitle)}</h3>
          <span style="font-style: italic; color: #6b7280;">Sep 2015 - May 2019</span>
        </div>
        <p style="margin: 0; color: #4b5563;">University of ${targetIndustry || 'State'}</p>
      </div>`
    }
  </div>
  
  <div class="section" style="margin-bottom: 25px;">
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 15px; padding-bottom: 8px; color: #1e40af; border-bottom: 1px solid #e5e7eb;">Skills</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
      ${(hasSkills ? hasProfile.skills : defaultSkills).map(skill => `
        <div style="background: #eff6ff; color: #1e40af; padding: 6px 12px; border-radius: 30px; font-size: 14px; font-weight: 500;">${skill}</div>
      `).join('')}
    </div>
  </div>

  ${hasProfile.certifications && hasProfile.certifications.length > 0 ? 
    `<div class="section" style="margin-bottom: 25px;">
      <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 15px; padding-bottom: 8px; color: #1e40af; border-bottom: 1px solid #e5e7eb;">Certifications</h2>
      <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563;">
        ${hasProfile.certifications.map(cert => `
          <li style="margin-bottom: 8px;">${cert.name} - ${cert.issuer} (${new Date(cert.date).getFullYear()})</li>
        `).join('')}
      </ul>
    </div>` : 
    ''
  }

  ${hasProfile.achievements && hasProfile.achievements.length > 0 ? 
    `<div class="section" style="margin-bottom: 25px;">
      <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 15px; padding-bottom: 8px; color: #1e40af; border-bottom: 1px solid #e5e7eb;">Achievements</h2>
      <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563;">
        ${hasProfile.achievements.map(achievement => `
          <li style="margin-bottom: 8px;">${achievement}</li>
        `).join('')}
      </ul>
    </div>` : 
    ''
  }

  <div class="footer" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280;">
    <p style="margin: 0;">References available upon request</p>
  </div>
</div>
  `;
}

// Helper function to generate default experience content based on job title
function generateDefaultExperience(jobTitle, targetIndustry) {
  const jobSpecificCompany = generateCompanyName(jobTitle, targetIndustry);
  const jobSpecificResponsibilities = generateResponsibilities(jobTitle);
  
  return `
    <div class="job" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">${jobTitle}</h3>
        <span style="font-style: italic; color: #6b7280;">Jan 2020 - Present</span>
      </div>
      <p class="company" style="margin: 0 0 10px; font-weight: 500; color: #4b5563;">${jobSpecificCompany}</p>
      <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563;">
        ${jobSpecificResponsibilities.map(responsibility => `
          <li style="margin-bottom: 8px;">${responsibility}</li>
        `).join('')}
      </ul>
    </div>
    <div class="job" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">${generateJuniorTitle(jobTitle)}</h3>
        <span style="font-style: italic; color: #6b7280;">Jun 2017 - Dec 2019</span>
      </div>
      <p class="company" style="margin: 0 0 10px; font-weight: 500; color: #4b5563;">${generateCompanyName(jobTitle, targetIndustry, true)}</p>
      <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563;">
        <li style="margin-bottom: 8px;">Assisted in ${generateRelevantTask(jobTitle, 4)}</li>
        <li style="margin-bottom: 8px;">Supported team in ${generateRelevantTask(jobTitle, 5)}</li>
        <li style="margin-bottom: 8px;">Contributed to ${generateRelevantTask(jobTitle, 6)}</li>
      </ul>
    </div>
  `;
}

// Helper function to generate a junior version of the job title
function generateJuniorTitle(jobTitle) {
  if (jobTitle.toLowerCase().includes('senior')) {
    return jobTitle.replace(/senior/i, '');
  }
  if (jobTitle.toLowerCase().includes('lead')) {
    return jobTitle.replace(/lead/i, '');
  }
  return `Junior ${jobTitle}`;
}

// Helper function to generate a relevant task based on job title
function generateRelevantTask(jobTitle, index) {
  const lowercaseTitle = jobTitle.toLowerCase();
  
  // Software/IT related tasks
  if (lowercaseTitle.includes('software') || lowercaseTitle.includes('developer') || lowercaseTitle.includes('engineer')) {
    const tasks = [
      "optimizing code efficiency resulting in 30% faster load times",
      "developing and implementing new features that increased user engagement by 25%",
      "reducing bug reports by 40% through improved testing procedures",
      "the development of RESTful APIs and microservices architecture",
      "implementing continuous integration and deployment pipelines",
      "projects that improved application performance and user experience"
    ];
    return tasks[index % tasks.length];
  }
  
  // Marketing related tasks
  if (lowercaseTitle.includes('market') || lowercaseTitle.includes('brand')) {
    const tasks = [
      "creating campaigns that increased conversion rates by 35%",
      "managing social media strategies that grew engagement by 40%",
      "implementing SEO optimizations that improved organic traffic by 55%",
      "content creation and distribution across multiple channels",
      "analyzing market trends and competitor activities",
      "campaigns that successfully positioned the company in new markets"
    ];
    return tasks[index % tasks.length];
  }
  
  // Management related tasks
  if (lowercaseTitle.includes('manager') || lowercaseTitle.includes('director')) {
    const tasks = [
      "leading teams to exceed quarterly targets by 25%",
      "implementing process improvements that increased efficiency by 30%",
      "reducing operational costs by 20% while maintaining quality",
      "strategic planning and resource allocation",
      "mentoring team members and improving employee retention",
      "cross-departmental initiatives that improved organizational effectiveness"
    ];
    return tasks[index % tasks.length];
  }
  
  // Generic tasks for any position
  const genericTasks = [
    "initiatives that increased efficiency by 30%",
    "implementing strategies that drove 25% growth in key metrics",
    "optimizing processes resulting in 20% cost reduction",
    "projects that aligned with company objectives and vision",
    "identifying and solving complex problems within deadlines",
    "innovative solutions that addressed critical business needs"
  ];
  
  return genericTasks[index % genericTasks.length];
}

// Helper function to generate a company name based on job title and industry
function generateCompanyName(jobTitle, targetIndustry, isSecond = false) {
  const lowercaseTitle = jobTitle.toLowerCase();
  const lowercaseIndustry = (targetIndustry || '').toLowerCase();
  
  let prefix = '';
  
  if (lowercaseTitle.includes('software') || lowercaseTitle.includes('developer') || lowercaseTitle.includes('engineer')) {
    prefix = isSecond ? 'Innovate' : 'Tech';
  } else if (lowercaseTitle.includes('market') || lowercaseTitle.includes('brand')) {
    prefix = isSecond ? 'Brand' : 'Media';
  } else if (lowercaseTitle.includes('manager') || lowercaseTitle.includes('director')) {
    prefix = isSecond ? 'Strategic' : 'Global';
  } else {
    prefix = isSecond ? 'Premier' : 'Advanced';
  }
  
  let suffix = '';
  
  if (lowercaseIndustry.includes('tech') || lowercaseIndustry.includes('software')) {
    suffix = isSecond ? 'Technologies' : 'Systems';
  } else if (lowercaseIndustry.includes('health') || lowercaseIndustry.includes('medical')) {
    suffix = isSecond ? 'Health' : 'Medical';
  } else if (lowercaseIndustry.includes('finance') || lowercaseIndustry.includes('bank')) {
    suffix = isSecond ? 'Financial' : 'Capital';
  } else if (lowercaseIndustry.includes('edu') || lowercaseIndustry.includes('learn')) {
    suffix = isSecond ? 'Learning' : 'Education';
  } else {
    suffix = isSecond ? 'Solutions' : 'Innovations';
  }
  
  return `${prefix} ${suffix}`;
}

// Helper function to generate default degree based on job title
function generateDefaultDegree(jobTitle) {
  const lowercaseTitle = jobTitle.toLowerCase();
  
  if (lowercaseTitle.includes('software') || lowercaseTitle.includes('developer') || lowercaseTitle.includes('engineer')) {
    return 'Bachelor of Science';
  } else if (lowercaseTitle.includes('market') || lowercaseTitle.includes('brand')) {
    return 'Bachelor of Arts';
  } else if (lowercaseTitle.includes('manager') || lowercaseTitle.includes('director')) {
    return 'Master of Business Administration';
  }
  
  return 'Bachelor of Science';
}

// Helper function to generate default field of study based on job title
function generateDefaultField(jobTitle) {
  const lowercaseTitle = jobTitle.toLowerCase();
  
  if (lowercaseTitle.includes('software') || lowercaseTitle.includes('developer')) {
    return 'Computer Science';
  } else if (lowercaseTitle.includes('data')) {
    return 'Data Science';
  } else if (lowercaseTitle.includes('engineer')) {
    return 'Engineering';
  } else if (lowercaseTitle.includes('market')) {
    return 'Marketing';
  } else if (lowercaseTitle.includes('brand')) {
    return 'Communication';
  } else if (lowercaseTitle.includes('manager') || lowercaseTitle.includes('director')) {
    return 'Business Administration';
  } else if (lowercaseTitle.includes('design')) {
    return 'Design';
  }
  
  return 'Business';
}

// Helper function to generate default skills based on job title
function generateDefaultSkills(jobTitle, targetIndustry) {
  const lowercaseTitle = jobTitle.toLowerCase();
  const skills = [];
  
  // Generic professional skills
  skills.push('Communication', 'Problem Solving', 'Project Management', 'Team Leadership');
  
  // Job-specific skills
  if (lowercaseTitle.includes('software') || lowercaseTitle.includes('developer') || lowercaseTitle.includes('engineer')) {
    skills.push('JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'RESTful APIs', 'Git', 'Agile Methodologies');
  } else if (lowercaseTitle.includes('data')) {
    skills.push('SQL', 'Python', 'Data Analysis', 'Tableau', 'Machine Learning', 'Statistical Analysis', 'Power BI');
  } else if (lowercaseTitle.includes('market')) {
    skills.push('Digital Marketing', 'SEO', 'Content Strategy', 'Google Analytics', 'Social Media Marketing', 'Email Campaigns');
  } else if (lowercaseTitle.includes('design')) {
    skills.push('UI/UX Design', 'Adobe Creative Suite', 'Figma', 'Wireframing', 'User Research', 'Visual Design');
  } else if (lowercaseTitle.includes('manager') || lowercaseTitle.includes('director')) {
    skills.push('Strategic Planning', 'Team Leadership', 'Budget Management', 'Performance Analysis', 'Risk Management');
  }
  
  // Industry-specific skills
  if (targetIndustry) {
    const lowercaseIndustry = targetIndustry.toLowerCase();
    if (lowercaseIndustry.includes('health') || lowercaseIndustry.includes('medical')) {
      skills.push('HIPAA Compliance', 'Electronic Medical Records');
    } else if (lowercaseIndustry.includes('finance')) {
      skills.push('Financial Analysis', 'Risk Assessment', 'Regulatory Compliance');
    } else if (lowercaseIndustry.includes('retail')) {
      skills.push('Inventory Management', 'Customer Experience', 'Sales Strategy');
    }
  }
  
  // Return 10 unique skills max
  return [...new Set(skills)].slice(0, 10);
}

// Helper function to generate responsibilities based on job title
function generateResponsibilities(jobTitle) {
  const lowercaseTitle = jobTitle.toLowerCase();
  const responsibilities = [];
  
  if (lowercaseTitle.includes('software') || lowercaseTitle.includes('developer') || lowercaseTitle.includes('engineer')) {
    responsibilities.push(
      'Developed and maintained high-quality software applications using modern technologies and best practices',
      'Collaborated with cross-functional teams to design and implement new features that increased user satisfaction by 35%',
      'Optimized application performance resulting in 40% improved load times and better user experience',
      'Implemented automated testing frameworks that reduced bug reports by 50% and improved code quality'
    );
  } else if (lowercaseTitle.includes('data')) {
    responsibilities.push(
      'Analyzed complex datasets to identify trends and insights that drove strategic decision-making',
      'Created comprehensive dashboards and visualizations that improved data accessibility for stakeholders',
      'Developed predictive models that increased forecast accuracy by 30%',
      'Collaborated with cross-functional teams to implement data-driven solutions'
    );
  } else if (lowercaseTitle.includes('market')) {
    responsibilities.push(
      'Developed and executed marketing campaigns that increased lead generation by 45%',
      'Managed social media presence across multiple platforms, growing follower base by 60%',
      'Created engaging content that improved brand awareness and customer engagement metrics',
      'Analyzed marketing performance data to optimize campaign strategies and ROI'
    );
  } else if (lowercaseTitle.includes('manager') || lowercaseTitle.includes('director')) {
    responsibilities.push(
      'Led a team of 12 professionals, providing mentorship and professional development opportunities',
      'Developed and implemented strategic initiatives that increased department efficiency by 25%',
      'Managed project budgets totaling $1.2M, consistently delivering results within budget constraints',
      'Collaborated with executive leadership to align department goals with organizational objectives'
    );
  } else {
    responsibilities.push(
      'Successfully managed key projects that aligned with company objectives and delivered measurable results',
      'Collaborated with cross-functional teams to implement process improvements',
      'Identified and resolved complex challenges, improving operational efficiency by 30%',
      'Maintained detailed documentation and reports to track progress against KPIs'
    );
  }
  
  return responsibilities;
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