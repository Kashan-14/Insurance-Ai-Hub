import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate required fields
    if (!body.blog_post_id || !body.content) {
      return NextResponse.json({ error: "Blog post ID and content are required" }, { status: 400 })
    }

    // Verify blog post exists and is published
    const { data: blogPost } = await supabase
      .from("blog_posts")
      .select("id, status")
      .eq("id", body.blog_post_id)
      .single()

    if (!blogPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    if (blogPost.status !== "published") {
      return NextResponse.json({ error: "Cannot comment on unpublished posts" }, { status: 400 })
    }

    // Insert review
    const { data, error } = await supabase
      .from("blog_reviews")
      .insert({
        blog_post_id: body.blog_post_id,
        user_id: user.id,
        content: body.content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to post comment" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Comment posted successfully",
      review: data,
    })
  } catch (error) {
    console.error("Review creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
