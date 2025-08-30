import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Edit, Eye, Trash2, Plus } from "lucide-react"
import Link from "next/link"

export default async function ManageBlogPage() {
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

  // Get blog posts based on role
  let query = supabase
    .from("blog_posts")
    .select(`
      *,
      users!blog_posts_author_id_fkey(name),
      companies(name)
    `)
    .order("created_at", { ascending: false })

  // If not admin, only show own posts
  if (userProfile.role !== "admin") {
    query = query.eq("author_id", user.id)
  }

  const { data: blogPosts, error } = await query

  if (error) {
    console.error("Error fetching blog posts:", error)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Manage Articles</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild>
                <Link href="/blog/create">
                  <Plus className="w-4 h-4 mr-2" />
                  New Article
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!blogPosts || blogPosts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500">
                <p className="text-lg mb-2">No articles found</p>
                <p className="mb-4">Create your first article to get started</p>
                <Button asChild>
                  <Link href="/blog/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Article
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {blogPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                        {post.companies?.name && <Badge variant="outline">{post.companies.name}</Badge>}
                      </div>
                      <CardTitle className="text-lg mb-1">{post.title}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center space-x-4 text-sm">
                          <span>By {post.users?.name || "Anonymous"}</span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                          {post.published_at && (
                            <span>Published {new Date(post.published_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {post.status === "published" && (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/blog/${post.slug}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/blog/edit/${post.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {post.excerpt && (
                  <CardContent>
                    <p className="text-gray-600 line-clamp-2">{post.excerpt}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
