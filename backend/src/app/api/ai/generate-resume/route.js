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

    const user = await User.findById(session.userId);
    
    if (!user) {
      console.log('AI Resume API: User not found');
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const hasProfile = user.profile || {};
    const hasExperience = hasProfile.experience && hasProfile.experience.length > 0;
    const hasEducation = hasProfile.education && hasProfile.education.length > 0;
    const hasSkills = hasProfile.skills && hasProfile.skills.length > 0;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
      console.log('AI Resume API: Using mock response (no API key)');
      
      const mockHtmlContent = generateDefaultResumeContent(user, jobTitle, targetCompany, targetIndustry, hasProfile, hasExperience, hasEducation, hasSkills);
      
      return NextResponse.json({
        success: true,
        content: mockHtmlContent
      });
    }

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

    const prompt = constructResumePrompt(userData, jobTitle, targetCompany, targetIndustry);
    
    try {


      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH"
          }
        ]
      });
      
      console.log('AI Resume API: Sending request to Gemini API');

      let attempts = 0;
      const maxAttempts = 3;
      let generatedContent = '';
      let result;
      
      while (attempts < maxAttempts) {
        try {

          result = await model.generateContent(prompt);
          const response = await result.response;
          generatedContent = response.text();
          

          if (generatedContent && generatedContent.length > 0) {
            break;
          }
          
          attempts++;
          console.log(`AI Resume API: Empty response, retrying (${attempts}/${maxAttempts})`);
          

          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          attempts++;
          console.error(`AI Resume API: Error on attempt ${attempts}/${maxAttempts}:`, err.message);
          
          if (attempts >= maxAttempts) {
            throw err; 
          }
          
 
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
      

      generatedContent = generatedContent.replace(/```html|```/g, '').trim();
      

      if (!generatedContent.trim().startsWith('<div') && !generatedContent.trim().startsWith('<html')) {
        generatedContent = `<div>${generatedContent}</div>`;
      }
      

      const htmlMatch = generatedContent.match(/<div[\s\S]*<\/div>/);
      if (htmlMatch) {
        generatedContent = htmlMatch[0];
      }
      

      generatedContent = fixHtmlIssues(generatedContent);
      
      console.log('AI Resume API: Successfully generated content');
      return NextResponse.json({
        success: true,
        content: generatedContent
      });
    } catch (apiError) {
      console.error('AI Resume API: Gemini API error:', apiError.message);
      

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


function formatExperienceForPrompt(experience) {
  return experience.map(exp => ({
    company: exp.company,
    position: exp.position,
    startDate: new Date(exp.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}),
    endDate: exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present',
    description: exp.description || ''
  }));
}


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

function generateDefaultSummary(name, jobTitle, targetCompany, targetIndustry, profile) {
  const hasSkills = profile.skills && profile.skills.length > 0;

  const qualities = getJobQualities(jobTitle);
  const randomQuality1 = qualities[0];
  const randomQuality2 = qualities[1];
  

  const verbs = getJobActionVerbs(jobTitle);
  const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];

  const skillsText = hasSkills 
    ? profile.skills.slice(0, 3).join(', ') 
    : getRelevantSkills(jobTitle, targetIndustry).slice(0, 3).join(', ');

  const summaryVariant = Math.floor(Math.random() * 3);
  
  if (summaryVariant === 0) {
    return `${randomQuality1} ${jobTitle} with ${Math.floor(Math.random() * 5) + 3}+ years of experience in ${skillsText}. Passionate about ${randomVerb} exceptional results${targetCompany ? ` for ${targetCompany}` : ''}${targetIndustry ? ` in the ${targetIndustry} industry` : ''}.`;
  } else if (summaryVariant === 1) {
    return `Results-driven ${jobTitle} with expertise in ${skillsText}. ${randomQuality2} professional committed to ${randomVerb} high-quality solutions${targetCompany ? ` at ${targetCompany}` : ''}${targetIndustry ? ` in the ${targetIndustry} sector` : ''}.`;
  } else {
    return `Accomplished ${jobTitle} offering strong skills in ${skillsText}. Known for ${randomVerb} innovative approaches to challenges${targetCompany ? ` that align with ${targetCompany}'s goals` : ''}${targetIndustry ? ` in the competitive ${targetIndustry} space` : ''}.`;
  }
}

function getJobQualities(jobTitle) {
  const lowercaseTitle = jobTitle.toLowerCase();

  const defaultQualities = [
    'Results-driven', 'Detail-oriented', 'Innovative', 'Highly motivated',
    'Strategic', 'Adaptable', 'Proactive', 'Collaborative'
  ];
  
  if (lowercaseTitle.includes('software') || lowercaseTitle.includes('developer') || lowercaseTitle.includes('engineer')) {
    return shuffleArray([
      'Detail-oriented', 'Analytical', 'Innovative', 'Technical',
      'Solutions-focused', 'Systems-thinking', 'Architecture-minded', 'Algorithm-savvy'
    ]).slice(0, 2);
  }
 
  if (lowercaseTitle.includes('data') || lowercaseTitle.includes('analyst')) {
    return shuffleArray([
      'Analytical', 'Data-driven', 'Detail-oriented', 'Solutions-focused',
      'Insights-oriented', 'Pattern-recognizing', 'Statistical', 'Methodical'
    ]).slice(0, 2);
  }
 
  if (lowercaseTitle.includes('market') || lowercaseTitle.includes('brand')) {
    return shuffleArray([
      'Creative', 'Results-driven', 'Strategic', 'Customer-focused',
      'Trend-aware', 'Growth-oriented', 'Audience-centric', 'Campaign-savvy'
    ]).slice(0, 2);
  }
  
  if (lowercaseTitle.includes('manager') || lowercaseTitle.includes('director') || lowercaseTitle.includes('lead')) {
    return shuffleArray([
      'Strategic', 'Leadership-focused', 'Results-oriented', 'Team-building',
      'Vision-driven', 'Decision-making', 'Objective-focused', 'Business-minded'
    ]).slice(0, 2);
  }
  
  return shuffleArray(defaultQualities).slice(0, 2);
}

function getJobActionVerbs(jobTitle) {
  const lowercaseTitle = jobTitle.toLowerCase();
  
  const defaultVerbs = [
    'delivering', 'implementing', 'developing', 'creating',
    'managing', 'optimizing', 'leading', 'executing'
  ];
  
  if (lowercaseTitle.includes('software') || lowercaseTitle.includes('developer') || lowercaseTitle.includes('engineer')) {
    return shuffleArray([
      'architecting', 'developing', 'engineering', 'implementing',
      'coding', 'designing', 'optimizing', 'building'
    ]);
  }
  if (lowercaseTitle.includes('data') || lowercaseTitle.includes('analyst')) {
    return shuffleArray([
      'analyzing', 'modeling', 'visualizing', 'interpreting',
      'forecasting', 'mining', 'transforming', 'extracting'
    ]);
  }
  
  if (lowercaseTitle.includes('market') || lowercaseTitle.includes('brand')) {
    return shuffleArray([
      'promoting', 'strategizing', 'branding', 'launching',
      'growing', 'positioning', 'engaging', 'communicating'
    ]);
  }
  
  if (lowercaseTitle.includes('manager') || lowercaseTitle.includes('director') || lowercaseTitle.includes('lead')) {
    return shuffleArray([
      'leading', 'directing', 'managing', 'overseeing',
      'guiding', 'spearheading', 'orchestrating', 'driving'
    ]);
  }
  
  return shuffleArray(defaultVerbs);
}

function getRelevantSkills(jobTitle, targetIndustry) {
  const lowercaseTitle = jobTitle.toLowerCase();
  const lowercaseIndustry = (targetIndustry || '').toLowerCase();
  
  const defaultSkills = [
    'project management', 'team collaboration', 'strategic planning',
    'problem-solving', 'communication', 'critical thinking'
  ];
  
  if (lowercaseTitle.includes('software') || lowercaseTitle.includes('developer') || lowercaseTitle.includes('engineer')) {
    const techSkills = [
      'JavaScript', 'Python', 'React', 'Node.js', 'cloud architecture',
      'full-stack development', 'API integration', 'system design'
    ];
    
    if (lowercaseIndustry.includes('web')) {
      return shuffleArray([...techSkills, 'responsive design', 'UX/UI', 'frontend frameworks']);
    }
    
    return shuffleArray(techSkills);
  }
  
  if (lowercaseTitle.includes('data') || lowercaseTitle.includes('analyst')) {
    return shuffleArray([
      'data analysis', 'SQL', 'data visualization', 'statistical modeling',
      'Python', 'R', 'machine learning', 'business intelligence'
    ]);
  }
  
  if (lowercaseTitle.includes('market') || lowercaseTitle.includes('brand')) {
    return shuffleArray([
      'digital marketing', 'content strategy', 'SEO', 'social media management',
      'campaign analytics', 'brand development', 'market research', 'CRM'
    ]);
  }
  
  if (lowercaseTitle.includes('manager') || lowercaseTitle.includes('director') || lowercaseTitle.includes('lead')) {
    return shuffleArray([
      'team leadership', 'strategic planning', 'performance management', 'budget oversight',
      'stakeholder communication', 'project management', 'business development', 'process improvement'
    ]);
  }
  
  if (lowercaseIndustry.includes('health')) {
    return shuffleArray([
      'healthcare operations', 'patient care', 'regulatory compliance',
      'medical terminology', 'health informatics', 'patient advocacy'
    ]);
  }
  
  if (lowercaseIndustry.includes('finance')) {
    return shuffleArray([
      'financial analysis', 'risk management', 'investment strategies',
      'regulatory compliance', 'portfolio management', 'financial reporting'
    ]);
  }
  
  return shuffleArray(defaultSkills);
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function constructResumePrompt(userData, jobTitle, targetCompany, targetIndustry) {
  const hasBasicInfo = userData.name && userData.email;
  const hasContactInfo = userData.phone || userData.address || userData.website || userData.linkedin || userData.github;
  const hasExperience = userData.experience && userData.experience.length > 0;
  const hasEducation = userData.education && userData.education.length > 0;
  const hasSkills = userData.skills && userData.skills.length > 0;
  const hasCertifications = userData.certifications && userData.certifications.length > 0;
  const hasAchievements = userData.achievements && userData.achievements.length > 0;
  
  const completenessScore = [
    hasBasicInfo, hasContactInfo, hasExperience, hasEducation, 
    hasSkills, hasCertifications, hasAchievements
  ].filter(Boolean).length / 7;
  
  let prompt = `You are an expert resume writer with years of experience creating ATS-optimized, professional resumes. 
Your task is to create a polished, modern HTML resume that will help the candidate stand out and pass ATS screenings.

CREATE A RESUME FOR:
A ${jobTitle} candidate`;
  
  if (targetCompany) {
    prompt += ` applying to ${targetCompany}`;
  }
  
  if (targetIndustry) {
    prompt += ` in the ${targetIndustry} industry`;
  }
  
  prompt += '.\n\n';
  
  if (completenessScore < 0.5) {
    prompt += `SPECIAL INSTRUCTION: This candidate has provided limited information. Please generate appropriate 
professional experiences, education, and skills that would be typical and impressive for a ${jobTitle} 
${targetIndustry ? `in the ${targetIndustry} industry` : ''}. Make it realistic but impressive.\n\n`;
  }
  
  prompt += 'CANDIDATE INFORMATION:\n';
  prompt += `Name: ${userData.name}\n`;
  prompt += `Email: ${userData.email}\n`;
  if (userData.phone) prompt += `Phone: ${userData.phone}\n`;
  if (userData.address) prompt += `Location: ${userData.address}\n`;
  if (userData.website) prompt += `Website: ${userData.website}\n`;
  if (userData.linkedin) prompt += `LinkedIn: ${userData.linkedin}\n`;
  if (userData.github) prompt += `GitHub: ${userData.github}\n`;
  
  prompt += '\nPROFESSIONAL SUMMARY:\n';
  prompt += userData.summary + '\n';
  
  prompt += '\nWORK EXPERIENCE:\n';
  if (hasExperience) {
    userData.experience.forEach(exp => {
      prompt += `Position: ${exp.position}\n`;
      prompt += `Company: ${exp.company}\n`;
      prompt += `Duration: ${exp.startDate} - ${exp.endDate}\n`;
      if (exp.description) prompt += `Description: ${exp.description}\n`;
      prompt += '\n';
    });
  } else {
    prompt += `IF No experience provided. Please generate 2-3 relevant work experiences for a ${jobTitle} role`;
    if (targetIndustry) prompt += ` in the ${targetIndustry} industry`;
    prompt += `. Make the experiences realistic, impressive, and include quantifiable achievements. Ensure job titles, company names, and dates are appropriate.\n`;
  }
  
  prompt += '\nEDUCATION:\n';
  if (hasEducation) {
    userData.education.forEach(edu => {
      prompt += `Degree: ${edu.degree} in ${edu.field}\n`;
      prompt += `Institution: ${edu.institution}\n`;
      prompt += `Duration: ${edu.startDate} - ${edu.endDate}\n`;
      if (edu.description) prompt += `Description: ${edu.description}\n`;
      prompt += '\n';
    });
  } else {
    prompt += `No education provided. Please generate an appropriate educational background for a ${jobTitle} role`;
    if (targetIndustry) prompt += ` in the ${targetIndustry} industry`;
    prompt += `. Include relevant degree, field of study, institution, and dates.\n`;
  }
  
  prompt += '\nSKILLS:\n';
  if (hasSkills) {
    prompt += userData.skills.join(', ') + '\n';
  } else {
    prompt += `No skills provided. Please generate 8-12 relevant technical and soft skills for a ${jobTitle} role`;
    if (targetIndustry) prompt += ` in the ${targetIndustry} industry`;
    prompt += `. Include a mix of hard and soft skills that would impress recruiters and pass ATS systems.\n`;
  }
  
  if (hasCertifications) {
    prompt += '\nCERTIFICATIONS:\n';
    userData.certifications.forEach(cert => {
      prompt += `${cert.name} from ${cert.issuer} (${new Date(cert.date).getFullYear()})\n`;
    });
  } else if (targetIndustry || jobTitle) {
    prompt += '\nCERTIFICATIONS:\n';
    prompt += `No certifications provided. If appropriate for a ${jobTitle} role`;
    if (targetIndustry) prompt += ` in the ${targetIndustry} industry`;
    prompt += `, please include 1-2 relevant industry certifications.\n`;
  }
  
  if (hasAchievements) {
    prompt += '\nACHIEVEMENTS:\n';
    userData.achievements.forEach(achievement => {
      prompt += `- ${achievement}\n`;
    });
  }
  
  prompt += `\nATS OPTIMIZATION:
1. Include job-specific keywords for ${jobTitle} positions
2. Use industry-standard section headings and formatting
3. Avoid tables, images, headers, footers, or complex layouts
4. Include relevant ${targetIndustry || "industry"} terminology
5. Use measurable achievements and quantified results`;
  
  prompt += `\n\nHTML FORMATTING INSTRUCTIONS:
1. Create clean, semantic HTML with inline CSS only
2. Use a professional single-column layout optimized for ATS systems
3. Use a modern, professional color scheme with subtle accents (preferably blue/navy/gray tones)
4. Ensure proper spacing and typography for readability
5. Use appropriate heading hierarchy (h1, h2, h3)
6. Create a balanced design with proper visual hierarchy
7. Include only the HTML content for the resume (no <html>, <head> or <doctype> tags)
8. Start the HTML with a single root <div> element containing the entire resume
9. Use bullet points for listing experiences, skills, and achievements
10. Format dates, job titles, and company names consistently
11. If creating experiences from scratch, include realistic metrics and achievements with numbers

RESPONSE FORMAT: Respond with ONLY the HTML resume content, nothing else - no explanations, no markdown formatting, just the raw HTML.  And if you feel that any section have have not good discribtion feel free to improve the content of that section and give a best of the resume for the same post`;

  return prompt;
}

function fixHtmlIssues(htmlContent) {
  htmlContent = htmlContent.replace(/^[\s\S]*?(<div[\s\S]*<\/div>)[\s\S]*$/, '$1');
 
  const commonTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'b', 'i'];
  
  commonTags.forEach(tag => {
    const openCount = (htmlContent.match(new RegExp(`<${tag}(\\s|>)`, 'g')) || []).length;
    const closeCount = (htmlContent.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    
    if (openCount > closeCount) {
      const difference = openCount - closeCount;
      for (let i = 0; i < difference; i++) {
        htmlContent += `</${tag}>`;
      }
    }
  });
  
  htmlContent = htmlContent
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|nbsp;|copy;|reg;|#\d+;)/g, '&amp;') 
    .replace(/<\s*script/gi, '&lt;script'); 
  
  htmlContent = htmlContent
    .replace(/position\s*:\s*fixed/gi, 'position: relative')
    .replace(/position\s*:\s*absolute/gi, 'position: relative')
    .replace(/width\s*:\s*\d+vw/gi, 'width: 100%')
    .replace(/height\s*:\s*\d+vh/gi, 'height: auto');
  
  return htmlContent;
}

function generateDefaultResumeContent(user, jobTitle, targetCompany, targetIndustry, hasProfile, hasExperience, hasEducation, hasSkills) {
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