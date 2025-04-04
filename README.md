# AI-Powered Resume Builder

An advanced web application that allows users to create professional resumes effortlessly using AI-powered tools.

## Features

- **User Authentication**: Secure registration, login, and profile management
- **Resume Creation & Management**: Create, edit, save, and manage multiple resumes
- **Multiple Resume Templates**: Choose from professional, modern, creative, minimalist, executive, technical, academic, and simple templates
- **AI-Powered Resume Generation**: Generate custom resumes using Gemini AI based on your profile information and target job
- **Smart Analysis Tools**:
  - ATS Compatibility Checker: Ensure your resume passes Applicant Tracking Systems
  - Grammar & Spelling Checker: Perfect your writing with AI-powered grammar checking
  - Originality Checker: Detect and improve generic or commonly used content
- **Rich Text Editor**: Google Docs-like interface for easy resume editing
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React.js (Vite) with Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: MongoDB
- **AI Integration**: Google Gemini API
- **Authentication**: JWT with HTTP-only cookies

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Google Gemini API key

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd resumebuilder
   ```

2. Install frontend dependencies
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies
   ```bash
   cd ../backend
   npm install
   ```

4. Create a `.env.local` file in the backend directory with the following variables:
   ```
   GEMINI_API_KEY=************************************
   EMAIL_USER=*********************
   EMAIL_PASSWORD=***************
   MONGODB_URI=**********************************

   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the application:
   - Frontend: http://localhost:5173 or http://127.0.0.1:5173
   - Backend API: http://localhost:3000


- Make sure there are no firewall or network issues blocking the connection

## Usage

1. **Register/Login**: Create an account or log in to access the dashboard
2. **Profile Setup**: Fill in your personal details, education, experience, skills, certifications, and achievements
3. **Create Resume**: 
   - Start a new resume by selecting a template
   - Use the AI-powered resume generator for a quick start
4. **Edit & Format**: Use the rich text editor to customize your resume
5. **Analyze & Improve**: Check your resume for ATS compatibility, grammar, and originality
6. **Save & Export**: Save your resume for future editing



