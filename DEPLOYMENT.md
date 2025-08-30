# Insurance AI Hub - Deployment Guide

## For New Owners / Buyers

This guide helps you deploy the Insurance AI Hub application to your own infrastructure.

### Prerequisites

1. **Vercel Account** (for hosting)
2. **Supabase Account** (for database)
3. **Groq Account** (for AI features)

### Step 1: Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database setup script:
   \`\`\`sql
   -- Copy and paste the contents of scripts/001_complete_database_setup.sql
   -- into your Supabase SQL editor and execute
   \`\`\`
3. Note your Supabase URL and anon key from Project Settings > API

### Step 2: AI Service Setup

1. Create account at [console.groq.com](https://console.groq.com)
2. Generate an API key
3. Note the API key for environment variables

### Step 3: Deploy to Vercel

1. Fork/clone this repository to your GitHub
2. Connect to Vercel and deploy
3. Add these environment variables in Vercel dashboard:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Configuration  
GROQ_API_KEY=your_groq_api_key

# Development (optional)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

### Step 4: Initial Admin Setup

1. Visit `/auth/register` and create the first admin account
2. Manually update the user role in Supabase:
   \`\`\`sql
   UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
   \`\`\`

### Data Migration (if purchasing with existing data)

If you're purchasing this with existing data:

1. **Export from seller's Supabase:**
   - Database schema: Use Supabase CLI or SQL dump
   - Data: CSV exports or SQL dumps

2. **Import to your Supabase:**
   - Run schema setup first
   - Import data using Supabase dashboard or SQL

### Customization

- **Branding**: Update logos, colors, and company info in the codebase
- **Domain**: Configure custom domain in Vercel
- **Email**: Set up email templates in Supabase Auth settings

### Support

The application is fully self-contained with no dependencies on the original owner's accounts after proper setup.
