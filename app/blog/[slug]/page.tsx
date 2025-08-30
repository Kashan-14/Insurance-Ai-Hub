import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User, Tag, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { BlogReviewForm } from "@/components/blog-review-form"
import { BlogReviews } from "@/components/blog-reviews"

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()

  // Get the blog post
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      users!blog_posts_author_id_fkey(name, image),
      companies(name)
    `)
    .eq("slug", params.slug)
    .eq("status", "published")
    .single()

  if (error || !post) {
    notFound()
  }

  // Get current user for review form
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get reviews for this post
  const { data: reviews } = await supabase
    .from("blog_reviews")
    .select(`
      *,
      users(name, image)
    `)
    .eq("blog_post_id", post.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button asChild variant="ghost" size="sm">
              <Link href="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article>
          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="aspect-video relative overflow-hidden rounded-lg mb-8">
              <Image src={post.cover_image_url || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
            </div>
          )}

          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 text-balance">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{post.users?.name || "Anonymous"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
              </div>
              {post.companies?.name && (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{post.companies.name}</Badge>
                </div>
              )}
            </div>

            {post.tags && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.split(", ").map((tag) => (
                  <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{post.content}</div>
          </div>
        </article>

        {/* Reviews Section */}
        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments ({reviews?.length || 0})</h2>

          {/* Review Form */}
          {user ? (
            <div className="mb-8">
              <BlogReviewForm blogPostId={post.id} />
            </div>
          ) : (
            <Card className="mb-8">
              <CardContent className="text-center py-6">
                <p className="text-gray-600 mb-4">Sign in to leave a comment</p>
                <Button asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <BlogReviews reviews={reviews || []} />
        </div>
      </main>
    </div>
  )
}
