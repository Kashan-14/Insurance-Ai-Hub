-- Insurance AI Hub - Complete Database Setup Script
-- This script is idempotent and can be run multiple times safely

-- =============================================
-- 1. CREATE ENUMS
-- =============================================

-- User Roles for granular access control
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin', 'company_admin', 'company_user', 'blog_author');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status for managing company registration workflow
DO $$ BEGIN
    CREATE TYPE company_registration_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status for managing blog post publication lifecycle
DO $$ BEGIN
    CREATE TYPE blog_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status for managing Q&A question resolution
DO $$ BEGIN
    CREATE TYPE question_status AS ENUM ('open', 'answered', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Lead Status for tracking lead progression
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'converted', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Priority levels for effective lead management
DO $$ BEGIN
    CREATE TYPE lead_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 2. CREATE TABLES
-- =============================================

-- 2.1 Application User Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    email_verified TIMESTAMP WITH TIME ZONE,
    role user_role DEFAULT 'customer',
    company_id UUID,
    is_active BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    social_links JSONB,
    preferences JSONB,
    phone TEXT,
    image TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 System Activity Tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    event_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 Approved Company Directory
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    website TEXT,
    logo_url TEXT,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    services_offered TEXT, -- comma-separated string
    operating_states TEXT, -- comma-separated string
    status company_registration_status DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for users.company_id after companies table is created
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id);

-- 2.4 Company Onboarding Requests
CREATE TABLE IF NOT EXISTS public.company_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    company_email TEXT UNIQUE NOT NULL,
    company_phone TEXT,
    company_website TEXT,
    company_description TEXT,
    company_address TEXT,
    company_city TEXT,
    company_state TEXT,
    company_zip_code TEXT,
    company_country TEXT,
    services_offered TEXT, -- comma-separated string
    operating_states TEXT, -- comma-separated string
    status company_registration_status DEFAULT 'pending',
    submitted_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.5 Content Repository
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image_url TEXT,
    tags TEXT, -- comma-separated string
    author_id UUID NOT NULL REFERENCES public.users(id),
    company_id UUID REFERENCES public.companies(id),
    status blog_status DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.6 User Feedback on Blogs
CREATE TABLE IF NOT EXISTS public.blog_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.7 Community Q&A Questions
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT, -- comma-separated string
    is_anonymous BOOLEAN DEFAULT false,
    asked_by UUID REFERENCES public.users(id), -- nullable for anonymous questions
    status question_status DEFAULT 'open',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.8 Responses to Questions
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answered_by UUID NOT NULL REFERENCES public.users(id),
    is_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.9 Content Rating System
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    question_id UUID REFERENCES public.questions(id),
    answer_id UUID REFERENCES public.answers(id),
    blog_post_id UUID REFERENCES public.blog_posts(id),
    vote_type BOOLEAN NOT NULL, -- true for upvote, false for downvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one vote per user per content item
    CONSTRAINT unique_question_vote UNIQUE (user_id, question_id),
    CONSTRAINT unique_answer_vote UNIQUE (user_id, answer_id),
    CONSTRAINT unique_blog_vote UNIQUE (user_id, blog_post_id),
    
    -- Ensure exactly one content type is referenced
    CONSTRAINT vote_content_check CHECK (
        (question_id IS NOT NULL AND answer_id IS NULL AND blog_post_id IS NULL) OR
        (question_id IS NULL AND answer_id IS NOT NULL AND blog_post_id IS NULL) OR
        (question_id IS NULL AND answer_id IS NULL AND blog_post_id IS NOT NULL)
    )
);

-- 2.10 Sales Opportunity Tracking
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company_name TEXT,
    insurance_type TEXT,
    query_details TEXT,
    status lead_status DEFAULT 'new',
    priority lead_priority DEFAULT 'medium',
    source TEXT DEFAULT 'website_form',
    assigned_to UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.11 User Alerts
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_asked_by ON public.questions(asked_by);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- =============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. CREATE RLS POLICIES
-- =============================================

-- 5.1 Users table policies
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
CREATE POLICY "users_insert_policy" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_policy" ON public.users;
CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "users_delete_policy" ON public.users;
CREATE POLICY "users_delete_policy" ON public.users
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 5.2 Companies table policies
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
CREATE POLICY "companies_select_policy" ON public.companies
    FOR SELECT USING (true); -- All can view approved companies

DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
CREATE POLICY "companies_insert_policy" ON public.companies
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
CREATE POLICY "companies_update_policy" ON public.companies
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'admin' OR (role = 'company_admin' AND company_id = companies.id)))
    );

DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;
CREATE POLICY "companies_delete_policy" ON public.companies
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 5.3 Company registrations policies
DROP POLICY IF EXISTS "company_registrations_select_policy" ON public.company_registrations;
CREATE POLICY "company_registrations_select_policy" ON public.company_registrations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR
        submitted_by = auth.uid()
    );

DROP POLICY IF EXISTS "company_registrations_insert_policy" ON public.company_registrations;
CREATE POLICY "company_registrations_insert_policy" ON public.company_registrations
    FOR INSERT WITH CHECK (true); -- Anyone can submit registration

DROP POLICY IF EXISTS "company_registrations_update_policy" ON public.company_registrations;
CREATE POLICY "company_registrations_update_policy" ON public.company_registrations
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 5.4 Blog posts policies
DROP POLICY IF EXISTS "blog_posts_select_policy" ON public.blog_posts;
CREATE POLICY "blog_posts_select_policy" ON public.blog_posts
    FOR SELECT USING (
        status = 'published' OR 
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "blog_posts_insert_policy" ON public.blog_posts;
CREATE POLICY "blog_posts_insert_policy" ON public.blog_posts
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'blog_author'))
    );

DROP POLICY IF EXISTS "blog_posts_update_policy" ON public.blog_posts;
CREATE POLICY "blog_posts_update_policy" ON public.blog_posts
    FOR UPDATE USING (
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "blog_posts_delete_policy" ON public.blog_posts;
CREATE POLICY "blog_posts_delete_policy" ON public.blog_posts
    FOR DELETE USING (
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 5.5 Blog reviews policies
DROP POLICY IF EXISTS "blog_reviews_select_policy" ON public.blog_reviews;
CREATE POLICY "blog_reviews_select_policy" ON public.blog_reviews
    FOR SELECT USING (true); -- All can view reviews

DROP POLICY IF EXISTS "blog_reviews_insert_policy" ON public.blog_reviews;
CREATE POLICY "blog_reviews_insert_policy" ON public.blog_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blog_reviews_update_policy" ON public.blog_reviews;
CREATE POLICY "blog_reviews_update_policy" ON public.blog_reviews
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "blog_reviews_delete_policy" ON public.blog_reviews;
CREATE POLICY "blog_reviews_delete_policy" ON public.blog_reviews
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 5.6 Questions policies
DROP POLICY IF EXISTS "questions_select_policy" ON public.questions;
CREATE POLICY "questions_select_policy" ON public.questions
    FOR SELECT USING (true); -- All can view questions

DROP POLICY IF EXISTS "questions_insert_policy" ON public.questions;
CREATE POLICY "questions_insert_policy" ON public.questions
    FOR INSERT WITH CHECK (
        (asked_by = auth.uid() AND NOT is_anonymous) OR 
        (asked_by IS NULL AND is_anonymous) OR
        auth.uid() IS NULL -- Allow anonymous users
    );

DROP POLICY IF EXISTS "questions_update_policy" ON public.questions;
CREATE POLICY "questions_update_policy" ON public.questions
    FOR UPDATE USING (
        asked_by = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "questions_delete_policy" ON public.questions;
CREATE POLICY "questions_delete_policy" ON public.questions
    FOR DELETE USING (
        asked_by = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 5.7 Answers policies
DROP POLICY IF EXISTS "answers_select_policy" ON public.answers;
CREATE POLICY "answers_select_policy" ON public.answers
    FOR SELECT USING (true); -- All can view answers

DROP POLICY IF EXISTS "answers_insert_policy" ON public.answers;
CREATE POLICY "answers_insert_policy" ON public.answers
    FOR INSERT WITH CHECK (auth.uid() = answered_by);

DROP POLICY IF EXISTS "answers_update_policy" ON public.answers;
CREATE POLICY "answers_update_policy" ON public.answers
    FOR UPDATE USING (
        answered_by = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "answers_delete_policy" ON public.answers;
CREATE POLICY "answers_delete_policy" ON public.answers
    FOR DELETE USING (
        answered_by = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 5.8 Votes policies
DROP POLICY IF EXISTS "votes_select_policy" ON public.votes;
CREATE POLICY "votes_select_policy" ON public.votes
    FOR SELECT USING (true); -- All can view vote counts

DROP POLICY IF EXISTS "votes_insert_policy" ON public.votes;
CREATE POLICY "votes_insert_policy" ON public.votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_update_policy" ON public.votes;
CREATE POLICY "votes_update_policy" ON public.votes
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "votes_delete_policy" ON public.votes;
CREATE POLICY "votes_delete_policy" ON public.votes
    FOR DELETE USING (user_id = auth.uid());

-- 5.9 Leads policies
DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
CREATE POLICY "leads_select_policy" ON public.leads
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR
        assigned_to = auth.uid()
    );

DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
CREATE POLICY "leads_insert_policy" ON public.leads
    FOR INSERT WITH CHECK (true); -- Anyone can submit leads

DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
CREATE POLICY "leads_update_policy" ON public.leads
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR
        assigned_to = auth.uid()
    );

DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;
CREATE POLICY "leads_delete_policy" ON public.leads
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 5.10 Notifications policies
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT WITH CHECK (true); -- System can create notifications

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
CREATE POLICY "notifications_delete_policy" ON public.notifications
    FOR DELETE USING (user_id = auth.uid());

-- 5.11 Audit logs policies (admin only)
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT WITH CHECK (true); -- System can create audit logs

-- =============================================
-- 6. CREATE FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_registrations_updated_at ON public.company_registrations;
CREATE TRIGGER update_company_registrations_updated_at BEFORE UPDATE ON public.company_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_reviews_updated_at ON public.blog_reviews;
CREATE TRIGGER update_blog_reviews_updated_at BEFORE UPDATE ON public.blog_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_answers_updated_at ON public.answers;
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON public.answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
        COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'customer')
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Trigger to create user profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 7. INSERT DEFAULT ADMIN USER
-- =============================================

-- Note: This creates a user in auth.users and public.users
-- The password will be 'admin123' - should be changed in production
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@insuranceaihub.com';
    
    IF admin_user_id IS NULL THEN
        -- Insert into auth.users (this will trigger the handle_new_user function)
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@insuranceaihub.com',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "System Admin", "role": "admin"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
        
        -- Get the created user ID
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@insuranceaihub.com';
        
        -- Update the user profile to admin role (in case trigger didn't work)
        UPDATE public.users 
        SET role = 'admin', name = 'System Admin'
        WHERE id = admin_user_id;
        
        RAISE NOTICE 'Default admin user created with email: admin@insuranceaihub.com and password: admin123';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END $$;

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Insurance AI Hub Database Setup Complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Default admin credentials:';
    RAISE NOTICE 'Email: admin@insuranceaihub.com';
    RAISE NOTICE 'Password: admin123';
    RAISE NOTICE 'Please change the admin password after first login!';
    RAISE NOTICE '==============================================';
END $$;
