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
    
    const { jobTitle, targetCompany, targetIndustry, template = 'professional' } = await request.json();
    
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
      
      const mockHtmlContent = generateDefaultResumeContent(user, jobTitle, targetCompany, targetIndustry, hasProfile, hasExperience, hasEducation, hasSkills, template);
      
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

    const prompt = constructResumePrompt(userData, jobTitle, targetCompany, targetIndustry, template);
    
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
      

      const fallbackContent = generateDefaultResumeContent(user, jobTitle, targetCompany, targetIndustry, hasProfile, hasExperience, hasEducation, hasSkills, template);
      
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

function constructResumePrompt(userData, jobTitle, targetCompany, targetIndustry, template = 'professional') {
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

  // Add template information
  prompt += `USE THIS SPECIFIC TEMPLATE STYLE: ${template}\n`;
  
  // Provide specific styling guidance based on the template
  if (template === 'professional') {
    prompt += `
Template style guidelines:
- Clean, traditional format suitable for corporate environments
- Use a neutral color palette (navy, gray, black)
- Center the header section with name and contact info
- Use horizontal dividers between sections
- Use standard, readable fonts
- Simple, elegant styling without too many design elements

HTML STRUCTURE GUIDANCE:
- Create a single-column layout with centered header 
- Keep the design traditional and corporate
- Content sections should be in this order: summary, experience, education, skills
- Put name and contact info centered at the top
- Use subtle borders or dividers between sections
`;
  } else if (template === 'creative') {
    prompt += `
Template style guidelines:
- Modern, eye-catching design for creative fields
- Use a distinctive color scheme with purple (#9c27b0) as primary accent color
- Include a circular element with the person's initial in the header
- Use distinctive section headers with color accents
- Style skills as pill/badge elements
- More visual spacing and modern typography

HTML STRUCTURE GUIDANCE:
- Create a circular avatar element with the person's first initial in purple (#9c27b0)
- Center the header section with the person's name below the avatar
- Use purple accent colors for section headers with underlines
- Display skills as pill-shaped badges with light purple background
- Use more white space and modern typography
- Center the summary in a light purple box with rounded corners
`;
  } else if (template === 'modern') {
    prompt += `
Template style guidelines:
- Contemporary two-column layout
- Left sidebar in blue (#1976d2) with contact info, skills and education
- Main content area on the right with summary and experience
- Clear hierarchy with distinct section headers
- Clean dividers and balanced spacing
- Professional but contemporary look

HTML STRUCTURE GUIDANCE:
- Create a two-column layout with a blue sidebar
- Put contact info, skills and education in the colored sidebar
- Put professional summary and work experience in the main right column
- Use blue accent colors for section headers in the main content
- Make sure the layout is responsive and can adjust to different screen sizes
- Use dividing lines for section headers
`;
  }

  prompt += '\n';
  
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

RESPONSE FORMAT: Respond with ONLY the HTML resume content, nothing else - no explanations, no markdown formatting, just the raw HTML.  And if you feel that any section have have not good discribtion feel free to improve the content of that section and give a best of the resume for the same post and if there no complete information according to job position feel free to add them and make resume more attractive me qualification and experience feel free to update the user data according to the requirement of the job and create a best resume for the user if there is no much content in user data feel free to add more and give complete and atttractive resume`;

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

function generateDefaultResumeContent(user, jobTitle, targetCompany, targetIndustry, hasProfile, hasExperience, hasEducation, hasSkills, template = 'professional') {
  const defaultSkills = generateDefaultSkills(jobTitle, targetIndustry);
  
  const name = user.name || 'Your Name';
  const email = user.email || 'your.email@example.com';
  const phone = hasProfile.personalDetails?.phone || '(123) 456-7890';
  const location = hasProfile.personalDetails?.address || 'City, State';
  
  const skillsList = hasSkills && hasProfile.skills.length > 0 
    ? hasProfile.skills 
    : defaultSkills;
  
  const experiences = hasExperience && hasProfile.experience && hasProfile.experience.length > 0
    ? hasProfile.experience.map(exp => ({
        title: exp.position,
        company: exp.company,
        startDate: new Date(exp.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}),
        endDate: exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present',
        description: exp.description || generateResponsibilities(jobTitle).join(' ')
      }))
    : [
        {
          title: jobTitle,
          company: generateCompanyName(jobTitle, targetIndustry),
          startDate: 'Jan 2020',
          endDate: 'Present',
          description: generateResponsibilities(jobTitle).join(' ')
        },
        {
          title: generateJuniorTitle(jobTitle),
          company: generateCompanyName(jobTitle, targetIndustry, true),
          startDate: 'Jun 2017',
          endDate: 'Dec 2019',
          description: [
            generateRelevantTask(jobTitle, 0),
            generateRelevantTask(jobTitle, 1),
            generateRelevantTask(jobTitle, 2)
          ].join(' ')
        }
      ];

  const education = hasEducation && hasProfile.education && hasProfile.education.length > 0
    ? hasProfile.education.map(edu => ({
        degree: edu.degree,
        field: edu.field,
        institution: edu.institution,
        startDate: new Date(edu.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}),
        endDate: edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'}) : 'Present'
      }))
    : [
        {
          degree: generateDefaultDegree(jobTitle),
          field: generateDefaultField(jobTitle),
          institution: 'University of ' + (targetIndustry || 'Technology'),
          startDate: 'Sep 2013',
          endDate: 'May 2017'
        }
      ];

  // Professional template (default)
  if (template === 'professional' || !template) {
    return `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #333;">${name}</h1>
        <p style="margin: 5px 0;">${email} | ${phone} | ${location}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Summary</h2>
        <p>${generateDefaultSummary(name, jobTitle, targetCompany, targetIndustry, hasProfile)}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Experience</h2>
        ${experiences.map(exp => `
          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0; font-size: 16px;">${exp.title}</h3>
            <p style="margin: 0; font-style: italic;">${exp.company} | ${exp.startDate} - ${exp.endDate}</p>
            <ul>
              ${exp.description.split('. ').filter(s => s.trim()).map(sentence => 
                `<li>${sentence.trim() + (sentence.endsWith('.') ? '' : '.')}</li>`
              ).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Education</h2>
        ${education.map(edu => `
          <div>
            <h3 style="margin: 0; font-size: 16px;">${edu.degree} in ${edu.field}</h3>
            <p style="margin: 0; font-style: italic;">${edu.institution} | ${edu.startDate} - ${edu.endDate}</p>
          </div>
        `).join('')}
      </div>
      <div>
        <h2 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Skills</h2>
        <p>${skillsList.join(', ')}</p>
      </div>
    </div>`;
  } 
  // Creative template
  else if (template === 'creative') {
    return `<div style="font-family: 'Roboto', sans-serif; max-width: 800px; margin: 0 auto; padding: 30px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="width: 120px; height: 120px; border-radius: 50%; background-color: #9c27b0; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <h1 style="margin: 0; color: white; font-size: 48px;">${name.charAt(0)}</h1>
        </div>
        <h1 style="margin: 0 0 10px; color: #9c27b0; font-size: 32px;">${name}</h1>
        <p style="margin: 5px 0; font-size: 16px; color: #666;">${email} | ${phone} | ${location}</p>
      </div>
      <div style="margin-bottom: 20px; text-align: center;">
        <p style="background-color: #f3e5f5; padding: 15px; border-radius: 8px; color: #555; font-style: italic;">
          ${generateDefaultSummary(name, jobTitle, targetCompany, targetIndustry, hasProfile)}
        </p>
      </div>
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 22px; color: #9c27b0; border-bottom: 2px solid #9c27b0; padding-bottom: 5px; display: inline-block;">Experience</h2>
        ${experiences.map(exp => `
          <div style="margin-bottom: 15px; padding: 10px 0;">
            <h3 style="margin: 0; font-size: 18px; color: #333;">${exp.title}</h3>
            <p style="margin: 5px 0 10px; font-style: italic; color: #666;">${exp.company} | ${exp.startDate} - ${exp.endDate}</p>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              ${exp.description.split('. ').filter(s => s.trim()).map(sentence => 
                `<li style="margin-bottom: 8px;">${sentence.trim() + (sentence.endsWith('.') ? '' : '.')}</li>`
              ).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 22px; color: #9c27b0; border-bottom: 2px solid #9c27b0; padding-bottom: 5px; display: inline-block;">Education</h2>
        ${education.map(edu => `
          <div style="padding: 10px 0;">
            <h3 style="margin: 0; font-size: 18px; color: #333;">${edu.degree} in ${edu.field}</h3>
            <p style="margin: 5px 0; font-style: italic; color: #666;">${edu.institution} | ${edu.startDate} - ${edu.endDate}</p>
          </div>
        `).join('')}
      </div>
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 22px; color: #9c27b0; border-bottom: 2px solid #9c27b0; padding-bottom: 5px; display: inline-block;">Skills</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">
          ${skillsList.map(skill => 
            `<span style="background-color: #f3e5f5; padding: 8px 15px; border-radius: 20px; color: #9c27b0; font-weight: 500;">${skill}</span>`
          ).join('')}
        </div>
      </div>
    </div>`;
  }
  // Modern template
  else if (template === 'modern') {
    return `<div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 30px;">
      <div style="display: flex; margin-bottom: 30px; flex-wrap: wrap;">
        <div style="background-color: #1976d2; width: 30%; padding: 30px; color: white; min-width: 200px; flex: 1;">
          <h1 style="margin: 0 0 20px; font-size: 28px;">${name}</h1>
          <p style="margin: 0 0 5px; font-size: 14px;">Email: ${email}</p>
          <p style="margin: 0 0 5px; font-size: 14px;">Phone: ${phone}</p>
          <p style="margin: 0 0 25px; font-size: 14px;">Location: ${location}</p>
          
          <h3 style="margin: 30px 0 15px; font-size: 18px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 10px;">Skills</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${skillsList.map(skill => 
              `<li style="margin-bottom: 8px;">${skill}</li>`
            ).join('')}
          </ul>
          
          <h3 style="margin: 30px 0 15px; font-size: 18px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 10px;">Education</h3>
          ${education.map(edu => `
            <h4 style="margin: 0; font-size: 16px;">${edu.degree} in ${edu.field}</h4>
            <p style="margin: 5px 0 0; font-style: italic; font-size: 14px;">${edu.institution}</p>
            <p style="margin: 5px 0 15px; font-size: 14px;">${edu.startDate} - ${edu.endDate}</p>
          `).join('')}
        </div>
        
        <div style="width: 70%; padding: 30px; min-width: 300px; flex: 2;">
          <h2 style="font-size: 20px; color: #1976d2; margin: 0 0 20px; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Professional Summary</h2>
          <p style="color: #444; line-height: 1.6;">${generateDefaultSummary(name, jobTitle, targetCompany, targetIndustry, hasProfile)}</p>
          
          <h2 style="font-size: 20px; color: #1976d2; margin: 30px 0 20px; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Work Experience</h2>
          
          ${experiences.map(exp => `
            <div style="margin-bottom: 20px;">
              <h3 style="margin: 0; font-size: 18px; color: #333;">${exp.title}</h3>
              <p style="margin: 5px 0; font-weight: 500; color: #666;">${exp.company} | ${exp.startDate} - ${exp.endDate}</p>
              <ul style="margin: 10px 0 0; padding-left: 20px; color: #444;">
                ${exp.description.split('. ').filter(s => s.trim()).map(sentence => 
                  `<li style="margin-bottom: 8px;">${sentence.trim() + (sentence.endsWith('.') ? '' : '.')}</li>`
                ).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
  }
}

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