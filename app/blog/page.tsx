import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, User, Tag, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface SearchParams {
  search?: string
  tag?: string
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  // Build query for published blog posts
  let query = supabase
    .from("blog_posts")
    .select(`
      *,
      users!blog_posts_author_id_fkey(name),
      companies(name)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  // Apply search filter
  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,content.ilike.%${searchParams.search}%`)
  }

  // Apply tag filter
  if (searchParams.tag) {
    query = query.ilike("tags", `%${searchParams.tag}%`)
  }

  const { data: blogPosts, error } = await query

  if (error) {
    console.error("Error fetching blog posts:", error)
  }

  // Get all unique tags for filter
  const { data: allPosts } = await supabase.from("blog_posts").select("tags").eq("status", "published")

  const allTags = Array.from(
    new Set(allPosts?.flatMap((post) => post.tags?.split(", ").filter(Boolean) || []).filter(Boolean) || []),
  ).sort()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                Insurance AI Hub
              </Link>
              <span className="text-gray-400">/</span>
              <h1 className="text-xl font-semibold text-gray-900">Blog</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Insurance Insights & News</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed with the latest trends, tips, and expert insights from the insurance industry
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <form method="GET" className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  name="search"
                  placeholder="Search articles..."
                  defaultValue={searchParams.search}
                  className="pl-10"
                />
                {searchParams.tag && <input type="hidden" name="tag" value={searchParams.tag} />}
              </form>
            </div>

            {/* Tag Filter */}
            <div className="flex flex-wrap gap-2">
              <Link href="/blog">
                <Badge variant={!searchParams.tag ? "default" : "outline"} className="cursor-pointer">
                  All
                </Badge>
              </Link>
              {allTags.slice(0, 6).map((tag) => (
                <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                  <Badge variant={searchParams.tag === tag ? "default" : "outline"} className="cursor-pointer">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {!blogPosts || blogPosts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500">
                {searchParams.search || searchParams.tag ? (
                  <div>
                    <p className="text-lg mb-2">No articles found</p>
                    <p>Try adjusting your search or filter criteria</p>
                    <Button asChild variant="outline" className="mt-4 bg-transparent">
                      <Link href="/blog">View All Articles</Link>
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg mb-2">No articles published yet</p>
                    <p>Check back soon for the latest insurance insights</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {post.cover_image_url && (
                  <div className="aspect-video relative overflow-hidden">
                    <Image
                      src={post.cover_image_url || "/placeholder.svg"}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{post.users?.name || "Anonymous"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 hover:text-blue-600">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </CardTitle>
                  {post.excerpt && <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>}
                </CardHeader>
                <CardContent>
                  {post.tags && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags
                        .split(", ")
                        .slice(0, 3)
                        .map((tag) => (
                          <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          </Link>
                        ))}
                    </div>
                  )}
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href={`/blog/${post.slug}`}>Read More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination could be added here for large datasets */}
      </main>
    </div>
  )
}
