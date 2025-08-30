// Database Types for Insurance AI Hub
// Generated from the database schema

export type UserRole = "customer" | "admin" | "company_admin" | "company_user" | "blog_author"
export type CompanyRegistrationStatus = "pending" | "approved" | "rejected"
export type BlogStatus = "draft" | "published" | "archived"
export type QuestionStatus = "open" | "answered" | "closed"
export type LeadStatus = "new" | "contacted" | "converted" | "closed"
export type LeadPriority = "low" | "medium" | "high"

// Database table interfaces
export interface User {
  id: string
  email: string
  name: string | null
  email_verified: string | null
  role: UserRole
  company_id: string | null
  is_active: boolean
  email_notifications: boolean
  social_links: Record<string, any> | null
  preferences: Record<string, any> | null
  phone: string | null
  image: string | null
  bio: string | null
  location: string | null
  website: string | null
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  email: string
  phone: string | null
  website: string | null
  logo_url: string | null
  description: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  services_offered: string | null
  operating_states: string | null
  status: CompanyRegistrationStatus
  created_at: string
  updated_at: string
}

export interface CompanyRegistration {
  id: string
  company_name: string
  company_email: string
  company_phone: string | null
  company_website: string | null
  company_description: string | null
  company_address: string | null
  company_city: string | null
  company_state: string | null
  company_zip_code: string | null
  company_country: string | null
  services_offered: string | null
  operating_states: string | null
  status: CompanyRegistrationStatus
  submitted_by: string | null
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  cover_image_url: string | null
  tags: string | null
  author_id: string
  company_id: string | null
  status: BlogStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface BlogReview {
  id: string
  blog_post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  title: string
  content: string
  tags: string | null
  is_anonymous: boolean
  asked_by: string | null
  status: QuestionStatus
  views: number
  created_at: string
  updated_at: string
}

export interface Answer {
  id: string
  content: string
  question_id: string
  answered_by: string
  is_accepted: boolean
  created_at: string
  updated_at: string
}

export interface Vote {
  id: string
  user_id: string
  question_id: string | null
  answer_id: string | null
  blog_post_id: string | null
  vote_type: boolean // true for upvote, false for downvote
  created_at: string
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  company_name: string | null
  insurance_type: string | null
  query_details: string | null
  status: LeadStatus
  priority: LeadPriority
  source: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  event_type: string
  resource_type: string | null
  resource_id: string | null
  details: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// Create types (omit auto-generated fields)
export type CreateUser = Omit<User, "id" | "created_at" | "updated_at">
export type CreateCompany = Omit<Company, "id" | "created_at" | "updated_at">
export type CreateCompanyRegistration = Omit<CompanyRegistration, "id" | "created_at" | "updated_at">
export type CreateBlogPost = Omit<BlogPost, "id" | "created_at" | "updated_at">
export type CreateBlogReview = Omit<BlogReview, "id" | "created_at" | "updated_at">
export type CreateQuestion = Omit<Question, "id" | "views" | "created_at" | "updated_at">
export type CreateAnswer = Omit<Answer, "id" | "created_at" | "updated_at">
export type CreateVote = Omit<Vote, "id" | "created_at">
export type CreateLead = Omit<Lead, "id" | "created_at" | "updated_at">
export type CreateNotification = Omit<Notification, "id" | "created_at" | "updated_at">
export type CreateAuditLog = Omit<AuditLog, "id" | "created_at">

// Update types (omit id and timestamps)
export type UpdateUser = Partial<Omit<User, "id" | "created_at" | "updated_at">>
export type UpdateCompany = Partial<Omit<Company, "id" | "created_at" | "updated_at">>
export type UpdateCompanyRegistration = Partial<Omit<CompanyRegistration, "id" | "created_at" | "updated_at">>
export type UpdateBlogPost = Partial<Omit<BlogPost, "id" | "created_at" | "updated_at">>
export type UpdateBlogReview = Partial<Omit<BlogReview, "id" | "created_at" | "updated_at">>
export type UpdateQuestion = Partial<Omit<Question, "id" | "created_at" | "updated_at">>
export type UpdateAnswer = Partial<Omit<Answer, "id" | "created_at" | "updated_at">>
export type UpdateLead = Partial<Omit<Lead, "id" | "created_at" | "updated_at">>
export type UpdateNotification = Partial<Omit<Notification, "id" | "created_at" | "updated_at">>
