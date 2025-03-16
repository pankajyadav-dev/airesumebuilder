import React from 'react';

// Template previews
const templates = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'A clean, professional template with a traditional layout',
    preview: `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 10px; transform: scale(0.8); transform-origin: top left;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #333;">John Doe</h1>
          <p style="margin: 5px 0;">john.doe@example.com | (123) 456-7890 | New York, NY</p>
          <p style="margin: 5px 0;">www.johndoe.com | linkedin.com/in/johndoe</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">Professional Summary</h2>
          <p>Experienced software engineer with a proven track record in developing web applications...</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">Experience</h2>
          <div style="margin-bottom: 10px;">
            <h3 style="font-size: 16px; margin: 0;">Senior Software Engineer | ABC Company</h3>
            <p style="margin: 2px 0; font-style: italic;">Jan 2018 - Present</p>
            <ul style="margin-top: 5px; padding-left: 20px;">
              <li>Led development of a new e-commerce platform</li>
              <li>Implemented CI/CD pipeline, reducing deployment time by 30%</li>
            </ul>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">Education</h2>
          <div>
            <h3 style="font-size: 16px; margin: 0;">BS in Computer Science | University of Technology</h3>
            <p style="margin: 2px 0; font-style: italic;">2014 - 2018</p>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">Skills</h2>
          <ul style="columns: 2; column-gap: 20px; padding-left: 20px;">
            <li>JavaScript</li>
            <li>React</li>
            <li>Node.js</li>
            <li>Python</li>
            <li>AWS</li>
            <li>Docker</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'A sleek, contemporary design with a vibrant accent color',
    preview: `
      <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 10px; transform: scale(0.8); transform-origin: top left;">
        <div style="display: flex; margin-bottom: 20px;">
          <div style="flex: 7; padding-right: 20px;">
            <h1 style="margin: 0; font-size: 28px; color: #2563eb;">Jane Smith</h1>
            <p style="margin: 5px 0; font-size: 18px; color: #64748b;">Full Stack Developer</p>
            <p style="margin: 15px 0 0 0; line-height: 1.5;">
              Innovative developer with a passion for creating elegant solutions to complex problems. Specialized in building responsive web applications with modern technologies.
            </p>
          </div>
          <div style="flex: 3; text-align: right;">
            <p style="margin: 2px 0;">jane.smith@example.com</p>
            <p style="margin: 2px 0;">(123) 456-7890</p>
            <p style="margin: 2px 0;">San Francisco, CA</p>
            <p style="margin: 2px 0;">github.com/janesmith</p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; color: #2563eb; margin-bottom: 10px; display: flex; align-items: center;">
            <span style="flex: 1; height: 1px; background-color: #2563eb; margin-right: 10px;"></span>
            Experience
            <span style="flex: 3; height: 1px; background-color: #2563eb; margin-left: 10px;"></span>
          </h2>
          <div style="margin-bottom: 15px;">
            <h3 style="font-size: 16px; margin: 0; color: #334155;">Senior Developer | XYZ Tech</h3>
            <p style="margin: 2px 0; font-style: italic; color: #64748b;">Mar 2019 - Present</p>
            <ul style="margin-top: 5px; padding-left: 20px; color: #334155;">
              <li>Architected and developed a microservices-based application</li>
              <li>Mentored junior developers and led code reviews</li>
            </ul>
          </div>
        </div>
        
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            <h2 style="font-size: 18px; color: #2563eb; margin-bottom: 10px; display: flex; align-items: center;">
              <span style="flex: 1; height: 1px; background-color: #2563eb; margin-right: 10px;"></span>
              Skills
              <span style="flex: 3; height: 1px; background-color: #2563eb; margin-left: 10px;"></span>
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
              <span style="background-color: #e0f2fe; color: #0c4a6e; padding: 3px 8px; border-radius: 12px; font-size: 11px;">React</span>
              <span style="background-color: #e0f2fe; color: #0c4a6e; padding: 3px 8px; border-radius: 12px; font-size: 11px;">Node.js</span>
              <span style="background-color: #e0f2fe; color: #0c4a6e; padding: 3px 8px; border-radius: 12px; font-size: 11px;">TypeScript</span>
              <span style="background-color: #e0f2fe; color: #0c4a6e; padding: 3px 8px; border-radius: 12px; font-size: 11px;">AWS</span>
            </div>
          </div>
          <div style="flex: 1;">
            <h2 style="font-size: 18px; color: #2563eb; margin-bottom: 10px; display: flex; align-items: center;">
              <span style="flex: 1; height: 1px; background-color: #2563eb; margin-right: 10px;"></span>
              Education
              <span style="flex: 3; height: 1px; background-color: #2563eb; margin-left: 10px;"></span>
            </h2>
            <div>
              <h3 style="font-size: 16px; margin: 0; color: #334155;">MS in Computer Science</h3>
              <p style="margin: 2px 0; color: #64748b;">Tech University, 2017</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'A bold, creative layout perfect for design-focused roles',
    preview: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 10px; transform: scale(0.8); transform-origin: top left; background-color: #f8fafc;">
        <div style="display: flex;">
          <div style="flex: 1; background-color: #4f46e5; color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">ALEX JOHNSON</h1>
              <p style="margin: 5px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">UI/UX Designer</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 5px; margin-bottom: 10px;">CONTACT</h2>
              <p style="margin: 5px 0;">alex@example.com</p>
              <p style="margin: 5px 0;">(123) 456-7890</p>
              <p style="margin: 5px 0;">Los Angeles, CA</p>
              <p style="margin: 5px 0;">behance.net/alexj</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 5px; margin-bottom: 10px;">SKILLS</h2>
              <div>
                <p style="margin: 5px 0; display: flex; align-items: center;">
                  <span>Figma</span>
                  <span style="margin-left: auto; display: flex;">
                    <span style="height: 8px; width: 8px; background-color: white; border-radius: 50%; margin-right: 2px;"></span>
                    <span style="height: 8px; width: 8px; background-color: white; border-radius: 50%; margin-right: 2px;"></span>
                    <span style="height: 8px; width: 8px; background-color: white; border-radius: 50%; margin-right: 2px;"></span>
                    <span style="height: 8px; width: 8px; background-color: white; border-radius: 50%; margin-right: 2px;"></span>
                    <span style="height: 8px; width: 8px; background-color: rgba(255,255,255,0.3); border-radius: 50%;"></span>
                  </span>
                </p>
                <p style="margin: 5px 0; display: flex; align-items: center;">
                  <span>Adobe XD</span>
                  <span style="margin-left: auto; display: flex;">
                    <span style="height: 8px; width: 8px; background-color: white; border-radius: 50%; margin-right: 2px;"></span>
                    <span style="height: 8px; width: 8px; background-color: white; border-radius: 50%; margin-right: 2px;"></span>
                    <span style="height: 8px; width: 8px; background-color: white; border-radius: 50%; margin-right: 2px;"></span>
                    <span style="height: 8px; width: 8px; background-color: white; border-radius: 50%; margin-right: 2px;"></span>
                    <span style="height: 8px; width: 8px; background-color: white; border-radius: 50%;"></span>
                  </span>
                </p>
              </div>
            </div>
            
            <div>
              <h2 style="font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 5px; margin-bottom: 10px;">EDUCATION</h2>
              <div>
                <h3 style="font-size: 14px; margin: 0;">BFA in Graphic Design</h3>
                <p style="margin: 2px 0; font-style: italic;">Design Academy, 2019</p>
              </div>
            </div>
          </div>
          
          <div style="flex: 2; padding: 20px; background-color: white;">
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 18px; color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; margin-bottom: 10px;">PROFILE</h2>
              <p>Award-winning UI/UX designer with 5+ years of experience creating intuitive and engaging digital experiences...</p>
            </div>
            
            <div>
              <h2 style="font-size: 18px; color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; margin-bottom: 10px;">EXPERIENCE</h2>
              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 16px; margin: 0; color: #333;">Senior UI Designer | Creative Studio</h3>
                <p style="margin: 2px 0; font-style: italic; color: #666;">Jun 2020 - Present</p>
                <ul style="margin-top: 5px; padding-left: 20px; color: #333;">
                  <li>Redesigned the company's flagship product, increasing user engagement by 40%</li>
                  <li>Led a team of 3 junior designers on multiple client projects</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'A clean, minimalist design with elegant typography',
    preview: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 10px; transform: scale(0.8); transform-origin: top left;">
        <div style="margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; color: #333; letter-spacing: 1px;">MICHAEL TAYLOR</h1>
          <div style="width: 40px; height: 3px; background-color: #333; margin: 10px 0;"></div>
          <p style="margin: 5px 0; color: #666;">Product Manager | michael@example.com | (123) 456-7890 | Portland, OR</p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">Experience</h2>
          <div style="margin-bottom: 15px;">
            <div style="display: flex; margin-bottom: 5px;">
              <h3 style="flex: 1; margin: 0; font-size: 16px; font-weight: 500; color: #333;">Senior Product Manager</h3>
              <p style="margin: 0; font-weight: 300; color: #666;">2019 - Present</p>
            </div>
            <p style="margin: 0 0 5px 0; font-weight: 400; color: #666;">Tech Innovations Inc.</p>
            <ul style="margin-top: 5px; padding-left: 20px; color: #333; font-weight: 300;">
              <li>Led product strategy for the company's SaaS platform</li>
              <li>Grew user base by 150% in 18 months through strategic feature development</li>
            </ul>
          </div>
        </div>
        
        <div style="display: flex; gap: 30px;">
          <div style="flex: 1;">
            <h2 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">Education</h2>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 500; color: #333;">MBA, Business Administration</h3>
              <p style="margin: 5px 0; font-weight: 300; color: #666;">University of Business, 2017</p>
            </div>
          </div>
          
          <div style="flex: 1;">
            <h2 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">Skills</h2>
            <p style="margin: 5px 0; font-weight: 300; color: #333;">Product Strategy • User Research • Agile Methodologies • Data Analysis • Roadmapping • A/B Testing • Cross-functional Leadership</p>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'A sophisticated template ideal for senior-level professionals',
    preview: `
      <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 10px; transform: scale(0.8); transform-origin: top left;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #d1d5db; padding-bottom: 15px;">
          <h1 style="margin: 0; font-size: 26px; color: #1e293b; font-weight: normal;">Sarah Williams</h1>
          <p style="margin: 5px 0; color: #475569; font-style: italic;">Chief Financial Officer</p>
          <p style="margin: 10px 0 0 0; color: #64748b;">
            <span>sarah.williams@example.com</span> • 
            <span>(123) 456-7890</span> • 
            <span>Chicago, IL</span> • 
            <span>linkedin.com/in/sarahwilliams</span>
          </p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1e293b; font-weight: normal; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Professional Summary</h2>
          <p style="margin: 0; line-height: 1.5; color: #334155;">Strategic financial executive with over 20 years of experience in corporate finance, M&A, and operational leadership. Proven track record of driving financial growth and optimizing business operations for Fortune 500 companies.</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1e293b; font-weight: normal; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Executive Experience</h2>
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <h3 style="margin: 0; font-size: 16px; color: #1e293b; font-weight: normal;">Chief Financial Officer | Global Enterprises Inc.</h3>
              <p style="margin: 0; color: #64748b;">2015 - Present</p>
            </div>
            <ul style="margin-top: 5px; padding-left: 20px; color: #334155;">
              <li>Oversee financial operations for a $2.5B global organization</li>
              <li>Led financial strategy for international expansion, resulting in 35% revenue growth</li>
            </ul>
          </div>
        </div>
        
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1e293b; font-weight: normal; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Education</h2>
            <div>
              <h3 style="margin: 0; font-size: 16px; color: #1e293b; font-weight: normal;">MBA, Finance</h3>
              <p style="margin: 5px 0; color: #64748b;">Harvard Business School, 2005</p>
            </div>
          </div>
          
          <div style="flex: 1;">
            <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1e293b; font-weight: normal; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Core Competencies</h2>
            <ul style="margin-top: 5px; padding-left: 20px; color: #334155; columns: 2;">
              <li>Strategic Financial Planning</li>
              <li>Mergers & Acquisitions</li>
              <li>Investor Relations</li>
              <li>Risk Management</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Perfect for software engineers and technical roles',
    preview: `
      <div style="font-family: 'Courier New', monospace; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 10px; transform: scale(0.8); transform-origin: top left;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #333;">David Chen</h1>
            <p style="margin: 5px 0; color: #666;">Software Engineer</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 2px 0;">david.chen@example.com</p>
            <p style="margin: 2px 0;">(123) 456-7890</p>
            <p style="margin: 2px 0;">github.com/davidchen</p>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #333;">Technical Skills</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <div style="flex: 1;">
              <h3 style="font-size: 14px; margin: 0 0 5px 0; color: #333;">Languages</h3>
              <p style="margin: 0; color: #666;">JavaScript, Python, Java, C++, SQL</p>
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: 14px; margin: 0 0 5px 0; color: #333;">Frameworks</h3>
              <p style="margin: 0; color: #666;">React, Node.js, Django, Spring</p>
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: 14px; margin: 0 0 5px 0; color: #333;">Tools</h3>
              <p style="margin: 0; color: #666;">Git, Docker, AWS, Jenkins</p>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #333;">Experience</h2>
          <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <h3 style="font-size: 14px; margin: 0; color: #333;">Senior Software Engineer | Tech Solutions Inc.</h3>
              <p style="margin: 0; color: #666;">2020 - Present</p>
            </div>
            <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #666;">
              <li>Developed microservices architecture using Node.js and Docker</li>
              <li>Implemented CI/CD pipeline with Jenkins and AWS</li>
            </ul>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #333;">Projects</h2>
          <div style="margin-bottom: 10px;">
            <h3 style="font-size: 14px; margin: 0 0 5px 0; color: #333;">E-commerce Platform</h3>
            <p style="margin: 0; color: #666;">Built a scalable e-commerce platform using React, Node.js, and MongoDB</p>
          </div>
        </div>
        
        <div>
          <h2 style="font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #333;">Education</h2>
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <h3 style="font-size: 14px; margin: 0; color: #333;">BS in Computer Science | Tech University</h3>
              <p style="margin: 0; color: #666;">2016 - 2020</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Ideal for researchers, professors, and academic positions',
    preview: `
      <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 10px; transform: scale(0.8); transform-origin: top left;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #333; font-weight: normal;">Dr. Emily Johnson</h1>
          <p style="margin: 5px 0; color: #666;">Associate Professor of Biology</p>
          <p style="margin: 5px 0; color: #666;">emily.johnson@university.edu | (123) 456-7890</p>
          <p style="margin: 5px 0; color: #666;">University of Science, Department of Biology</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 16px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; color: #333; font-weight: normal;">Education</h2>
          <div style="margin-bottom: 10px;">
            <p style="margin: 0 0 5px 0;"><strong>Ph.D. in Molecular Biology</strong>, University of Science, 2015</p>
            <p style="margin: 0 0 5px 0;"><strong>M.S. in Biology</strong>, State University, 2011</p>
            <p style="margin: 0;"><strong>B.S. in Biology</strong>, Liberal Arts College, 2009</p>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 16px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; color: #333; font-weight: normal;">Research Interests</h2>
          <ul style="margin: 0; padding-left: 20px; color: #333;">
            <li>Molecular mechanisms of cell signaling</li>
            <li>Gene expression regulation in cancer cells</li>
            <li>Development of novel therapeutic approaches</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 16px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; color: #333; font-weight: normal;">Publications</h2>
          <p style="margin: 0 0 5px 0; color: #333;">Johnson, E., Smith, J., et al. (2022). "Novel mechanisms of gene regulation in cancer cells." <em>Journal of Molecular Biology</em>, 45(2), 112-128.</p>
          <p style="margin: 0; color: #333;">Brown, A., Johnson, E., et al. (2020). "Therapeutic approaches to targeting signaling pathways in cancer." <em>Cancer Research</em>, 80(3), 345-359.</p>
        </div>
        
        <div>
          <h2 style="font-size: 16px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; color: #333; font-weight: normal;">Teaching Experience</h2>
          <div style="margin-bottom: 10px;">
            <p style="margin: 0 0 5px 0;"><strong>Associate Professor</strong>, University of Science, 2019-Present</p>
            <p style="margin: 0;"><strong>Assistant Professor</strong>, University of Science, 2015-2019</p>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'simple',
    name: 'Simple',
    description: 'A clean, straightforward layout for all professions',
    preview: `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 10px; transform: scale(0.8); transform-origin: top left;">
        <div style="margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #333; text-align: center;">Robert Wilson</h1>
          <p style="margin: 5px 0; color: #666; text-align: center;">robert.wilson@example.com | (123) 456-7890 | New York, NY</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 16px; background-color: #f2f2f2; padding: 5px; margin-bottom: 10px; color: #333;">Summary</h2>
          <p style="margin: 0; color: #333;">Marketing professional with 5+ years of experience in digital marketing, content creation, and campaign management. Proven track record of increasing engagement and driving conversions.</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 16px; background-color: #f2f2f2; padding: 5px; margin-bottom: 10px; color: #333;">Experience</h2>
          <div style="margin-bottom: 10px;">
            <h3 style="font-size: 14px; margin: 0 0 5px 0; color: #333;">Marketing Manager | ABC Marketing</h3>
            <p style="margin: 0 0 5px 0; color: #666; font-style: italic;">Jan 2020 - Present</p>
            <ul style="margin: 0; padding-left: 20px; color: #333;">
              <li>Managed digital marketing campaigns across multiple platforms</li>
              <li>Increased social media engagement by 45% through strategic content planning</li>
            </ul>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 16px; background-color: #f2f2f2; padding: 5px; margin-bottom: 10px; color: #333;">Education</h2>
          <div>
            <h3 style="font-size: 14px; margin: 0 0 5px 0; color: #333;">BA in Marketing | State University</h3>
            <p style="margin: 0; color: #666; font-style: italic;">2012 - 2016</p>
          </div>
        </div>
        
        <div>
          <h2 style="font-size: 16px; background-color: #f2f2f2; padding: 5px; margin-bottom: 10px; color: #333;">Skills</h2>
          <p style="margin: 0; color: #333;">Digital Marketing • Content Strategy • Social Media Management • SEO/SEM • Email Marketing • Analytics • Campaign Management</p>
        </div>
      </div>
    `
  }
];

function ResumeTemplates({ selectedTemplate, onSelectTemplate }) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-xl p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">Choose a Template</h2>
      <p className="text-gray-600 mb-8">Select a template to get started with your resume. You can always change it later.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((template) => (
          <div 
            key={template.id}
            className={`border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              selectedTemplate === template.id 
                ? 'ring-2 ring-blue-500 shadow-lg scale-[1.02]' 
                : 'hover:border-blue-200'
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className="h-56 overflow-hidden bg-white border-b relative">
              <div dangerouslySetInnerHTML={{ __html: template.preview }} className="transform transition-transform duration-500 hover:scale-110 origin-top" />
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-md animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-5 bg-gradient-to-br from-white to-gray-50">
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-2">{template.description}</p>
              <div className="mt-3">
                <button 
                  className={`text-sm px-3 py-1 rounded-md transition-colors duration-200 ${
                    selectedTemplate === template.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedTemplate === template.id ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Convert a template ID to actual HTML content for the resume
export function getTemplateHtml(templateId, userData) {
  // Find the template
  const template = templates.find(t => t.id === templateId) || templates[0];
  
  // Basic template rendering - in a real app, you'd have more sophisticated templating
  switch(templateId) {
    case 'professional':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px; color: #333;">${userData.name || 'Your Name'}</h1>
            <p style="margin: 5px 0;">${userData.email || 'email@example.com'} | ${userData.phone || '(123) 456-7890'} | ${userData.location || 'City, State'}</p>
            <p style="margin: 5px 0;">${userData.website || ''} ${userData.linkedin ? '| ' + userData.linkedin : ''}</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">Professional Summary</h2>
            <p>${userData.summary || 'Your professional summary goes here...'}</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">Experience</h2>
            ${userData.experience ? userData.experience.map(exp => `
              <div style="margin-bottom: 10px;">
                <h3 style="font-size: 16px; margin: 0;">${exp.title} | ${exp.company}</h3>
                <p style="margin: 2px 0; font-style: italic;">${exp.startDate} - ${exp.endDate || 'Present'}</p>
                <p>${exp.description}</p>
              </div>
            `).join('') : '<p>Your experience goes here...</p>'}
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">Education</h2>
            ${userData.education ? userData.education.map(edu => `
              <div>
                <h3 style="font-size: 16px; margin: 0;">${edu.degree} | ${edu.school}</h3>
                <p style="margin: 2px 0; font-style: italic;">${edu.startDate} - ${edu.endDate || 'Present'}</p>
              </div>
            `).join('') : '<p>Your education goes here...</p>'}
          </div>
          
          <div>
            <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">Skills</h2>
            ${userData.skills ? `
              <ul style="columns: 2; column-gap: 20px; padding-left: 20px;">
                ${userData.skills.map(skill => `<li>${skill}</li>`).join('')}
              </ul>
            ` : '<p>Your skills go here...</p>'}
          </div>
        </div>
      `;
    
    case 'modern':
      // Modern template HTML implementation
      return `
        <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="display: flex; margin-bottom: 20px;">
            <div style="flex: 7; padding-right: 20px;">
              <h1 style="margin: 0; font-size: 28px; color: #2563eb;">${userData.name || 'Your Name'}</h1>
              <p style="margin: 5px 0; font-size: 18px; color: #64748b;">${userData.title || 'Your Title'}</p>
              <p style="margin: 15px 0 0 0; line-height: 1.5;">
                ${userData.summary || 'Your professional summary goes here...'}
              </p>
            </div>
            <div style="flex: 3; text-align: right;">
              <p style="margin: 2px 0;">${userData.email || 'email@example.com'}</p>
              <p style="margin: 2px 0;">${userData.phone || '(123) 456-7890'}</p>
              <p style="margin: 2px 0;">${userData.location || 'City, State'}</p>
              <p style="margin: 2px 0;">${userData.website || ''}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; margin-bottom: 10px; display: flex; align-items: center;">
              <span style="flex: 1; height: 1px; background-color: #2563eb; margin-right: 10px;"></span>
              Experience
              <span style="flex: 3; height: 1px; background-color: #2563eb; margin-left: 10px;"></span>
            </h2>
            ${userData.experience ? userData.experience.map(exp => `
              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 16px; margin: 0; color: #334155;">${exp.title} | ${exp.company}</h3>
                <p style="margin: 2px 0; font-style: italic; color: #64748b;">${exp.startDate} - ${exp.endDate || 'Present'}</p>
                <p>${exp.description}</p>
              </div>
            `).join('') : '<p>Your experience goes here...</p>'}
          </div>
          
          <div style="display: flex; gap: 20px;">
            <div style="flex: 1;">
              <h2 style="font-size: 18px; color: #2563eb; margin-bottom: 10px; display: flex; align-items: center;">
                <span style="flex: 1; height: 1px; background-color: #2563eb; margin-right: 10px;"></span>
                Skills
                <span style="flex: 3; height: 1px; background-color: #2563eb; margin-left: 10px;"></span>
              </h2>
              ${userData.skills ? `
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                  ${userData.skills.map(skill => `<span style="background-color: #e0f2fe; color: #0c4a6e; padding: 3px 8px; border-radius: 12px; font-size: 11px;">${skill}</span>`).join('')}
                </div>
              ` : '<p>Your skills go here...</p>'}
            </div>
            <div style="flex: 1;">
              <h2 style="font-size: 18px; color: #2563eb; margin-bottom: 10px; display: flex; align-items: center;">
                <span style="flex: 1; height: 1px; background-color: #2563eb; margin-right: 10px;"></span>
                Education
                <span style="flex: 3; height: 1px; background-color: #2563eb; margin-left: 10px;"></span>
              </h2>
              ${userData.education ? userData.education.map(edu => `
                <div>
                  <h3 style="font-size: 16px; margin: 0; color: #334155;">${edu.degree}</h3>
                  <p style="margin: 2px 0; color: #64748b;">${edu.school}, ${edu.endDate || ''}</p>
                </div>
              `).join('') : '<p>Your education goes here...</p>'}
            </div>
          </div>
        </div>
      `;
      
    case 'technical':
      return `
        <div style="font-family: 'Courier New', monospace; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h1 style="margin: 0; font-size: 24px; color: #333;">${userData.name || 'Your Name'}</h1>
              <p style="margin: 5px 0; color: #666;">${userData.title || 'Your Title'}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 2px 0;">${userData.email || 'email@example.com'}</p>
              <p style="margin: 2px 0;">${userData.phone || '(123) 456-7890'}</p>
              <p style="margin: 2px 0;">${userData.website || 'github.com/yourusername'}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #333;">Technical Skills</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              <div style="flex: 1;">
                <h3 style="font-size: 16px; margin: 0 0 5px 0; color: #333;">Languages</h3>
                <p style="margin: 0; color: #666;">${userData.skills ? userData.skills.filter(s => s.toLowerCase().includes('language') || ['javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php'].some(lang => s.toLowerCase().includes(lang))).join(', ') || 'List your programming languages' : 'List your programming languages'}</p>
              </div>
              <div style="flex: 1;">
                <h3 style="font-size: 16px; margin: 0 0 5px 0; color: #333;">Frameworks</h3>
                <p style="margin: 0; color: #666;">${userData.skills ? userData.skills.filter(s => s.toLowerCase().includes('framework') || ['react', 'angular', 'vue', 'django', 'flask', 'spring', 'express', 'laravel'].some(fw => s.toLowerCase().includes(fw))).join(', ') || 'List your frameworks' : 'List your frameworks'}</p>
              </div>
              <div style="flex: 1;">
                <h3 style="font-size: 16px; margin: 0 0 5px 0; color: #333;">Tools</h3>
                <p style="margin: 0; color: #666;">${userData.skills ? userData.skills.filter(s => s.toLowerCase().includes('tool') || ['git', 'docker', 'kubernetes', 'aws', 'azure', 'jenkins', 'jira'].some(tool => s.toLowerCase().includes(tool))).join(', ') || 'List your tools' : 'List your tools'}</p>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #333;">Experience</h2>
            ${userData.experience ? userData.experience.map(exp => `
              <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <h3 style="font-size: 16px; margin: 0; color: #333;">${exp.title} | ${exp.company}</h3>
                  <p style="margin: 0; color: #666;">${exp.startDate} - ${exp.endDate || 'Present'}</p>
                </div>
                <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #666;">
                  ${exp.description ? exp.description.split('.').filter(s => s.trim()).map(s => `<li>${s.trim()}.</li>`).join('') : '<li>Describe your responsibilities and achievements</li>'}
                </ul>
              </div>
            `).join('') : '<p>Your experience goes here...</p>'}
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #333;">Projects</h2>
            <div style="margin-bottom: 10px;">
              <h3 style="font-size: 16px; margin: 0 0 5px 0; color: #333;">Your Project Name</h3>
              <p style="margin: 0; color: #666;">Describe your project and the technologies used</p>
            </div>
          </div>
          
          <div>
            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #333;">Education</h2>
            ${userData.education ? userData.education.map(edu => `
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <h3 style="font-size: 16px; margin: 0; color: #333;">${edu.degree} | ${edu.school}</h3>
                  <p style="margin: 0; color: #666;">${edu.startDate} - ${edu.endDate || 'Present'}</p>
                </div>
              </div>
            `).join('') : '<p>Your education goes here...</p>'}
          </div>
        </div>
      `;
      
    case 'academic':
      return `
        <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px; color: #333; font-weight: normal;">${userData.name || 'Your Name'}</h1>
            <p style="margin: 5px 0; color: #666;">${userData.title || 'Your Title'}</p>
            <p style="margin: 5px 0; color: #666;">${userData.email || 'email@example.com'} | ${userData.phone || '(123) 456-7890'}</p>
            <p style="margin: 5px 0; color: #666;">${userData.location || 'Your Institution, Department'}</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; color: #333; font-weight: normal;">Education</h2>
            ${userData.education ? userData.education.map(edu => `
              <p style="margin: 0 0 5px 0;"><strong>${edu.degree}</strong>, ${edu.school}, ${edu.endDate || ''}</p>
            `).join('') : `
              <p style="margin: 0 0 5px 0;"><strong>Ph.D. in Your Field</strong>, Your University, Year</p>
              <p style="margin: 0 0 5px 0;"><strong>M.S. in Your Field</strong>, Your University, Year</p>
              <p style="margin: 0;"><strong>B.S. in Your Field</strong>, Your University, Year</p>
            `}
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; color: #333; font-weight: normal;">Research Interests</h2>
            <ul style="margin: 0; padding-left: 20px; color: #333;">
              ${userData.skills ? userData.skills.map(skill => `<li>${skill}</li>`).join('') : `
                <li>Your research interest 1</li>
                <li>Your research interest 2</li>
                <li>Your research interest 3</li>
              `}
            </ul>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; color: #333; font-weight: normal;">Publications</h2>
            ${userData.achievements ? userData.achievements.map(achievement => `
              <p style="margin: 0 0 5px 0; color: #333;">${achievement}</p>
            `).join('') : `
              <p style="margin: 0 0 5px 0; color: #333;">Author, A., Co-author, B., et al. (Year). "Title of your publication." <em>Journal Name</em>, Volume(Issue), Pages.</p>
              <p style="margin: 0; color: #333;">Author, A., Co-author, B., et al. (Year). "Title of your publication." <em>Journal Name</em>, Volume(Issue), Pages.</p>
            `}
          </div>
          
          <div>
            <h2 style="font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; color: #333; font-weight: normal;">Teaching Experience</h2>
            ${userData.experience ? userData.experience.map(exp => `
              <p style="margin: 0 0 5px 0;"><strong>${exp.title}</strong>, ${exp.company}, ${exp.startDate} - ${exp.endDate || 'Present'}</p>
            `).join('') : `
              <p style="margin: 0 0 5px 0;"><strong>Your Position</strong>, Your Institution, Years</p>
              <p style="margin: 0;"><strong>Your Position</strong>, Your Institution, Years</p>
            `}
          </div>
        </div>
      `;
      
    case 'simple':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px; color: #333; text-align: center;">${userData.name || 'Your Name'}</h1>
            <p style="margin: 5px 0; color: #666; text-align: center;">${userData.email || 'email@example.com'} | ${userData.phone || '(123) 456-7890'} | ${userData.location || 'City, State'}</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; background-color: #f2f2f2; padding: 5px; margin-bottom: 10px; color: #333;">Summary</h2>
            <p style="margin: 0; color: #333;">${userData.summary || 'Write a brief summary of your professional background and key strengths.'}</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; background-color: #f2f2f2; padding: 5px; margin-bottom: 10px; color: #333;">Experience</h2>
            ${userData.experience ? userData.experience.map(exp => `
              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 16px; margin: 0 0 5px 0; color: #333;">${exp.title} | ${exp.company}</h3>
                <p style="margin: 0 0 5px 0; color: #666; font-style: italic;">${exp.startDate} - ${exp.endDate || 'Present'}</p>
                <ul style="margin: 0; padding-left: 20px; color: #333;">
                  ${exp.description ? exp.description.split('.').filter(s => s.trim()).map(s => `<li>${s.trim()}.</li>`).join('') : '<li>Describe your responsibilities and achievements</li>'}
                </ul>
              </div>
            `).join('') : '<p>Your experience goes here...</p>'}
          </div>
          
          <div style="margin-bottom: 15px;">
            <h2 style="font-size: 18px; background-color: #f2f2f2; padding: 5px; margin-bottom: 10px; color: #333;">Education</h2>
            ${userData.education ? userData.education.map(edu => `
              <div>
                <h3 style="font-size: 16px; margin: 0 0 5px 0; color: #333;">${edu.degree} | ${edu.school}</h3>
                <p style="margin: 0; color: #666; font-style: italic;">${edu.startDate} - ${edu.endDate || 'Present'}</p>
              </div>
            `).join('') : '<p>Your education goes here...</p>'}
          </div>
          
          <div>
            <h2 style="font-size: 18px; background-color: #f2f2f2; padding: 5px; margin-bottom: 10px; color: #333;">Skills</h2>
            <p style="margin: 0; color: #333;">${userData.skills ? userData.skills.join(' • ') : 'List your skills separated by bullets (•)'}</p>
          </div>
        </div>
      `;
    
    default:
      return `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>${userData.name || 'Your Name'}</h1>
          <p>Please select a template to customize your resume.</p>
        </div>
      `;
  }
}

export default ResumeTemplates; 