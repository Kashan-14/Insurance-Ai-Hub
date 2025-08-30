import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BlogPostForm } from "@/components/blog-post-form"

export default async function CreateBlogPage() {
  const supabase = await createClient()

  // Check authentication and role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: userProfile } = await supabase.from("users").select("role, company_id").eq("id", user.id).single()

  if (!userProfile || !["admin", "blog_author"].includes(userProfile.role)) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Create New Article</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BlogPostForm userId={user.id} companyId={userProfile.company_id} />
      </main>
    </div>
  )
}
