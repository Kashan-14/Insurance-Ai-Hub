import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type { CreateBlogPost } from "@/lib/types/database"

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

    // Check user role
    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!userProfile || !["admin", "blog_author"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validate required fields
    if (!body.title || !body.content || !body.slug) {
      return NextResponse.json({ error: "Title, content, and slug are required" }, { status: 400 })
    }

    // Check if slug already exists
    const { data: existingPost } = await supabase.from("blog_posts").select("id").eq("slug", body.slug).single()

    if (existingPost) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 })
    }

    // Prepare blog post data
    const blogPostData: CreateBlogPost = {
      title: body.title,
      slug: body.slug,
      content: body.content,
      excerpt: body.excerpt || null,
      cover_image_url: body.cover_image_url || null,
      tags: body.tags || null,
      author_id: user.id,
      company_id: body.company_id || null,
      status: body.status || "draft",
      published_at: body.status === "published" ? new Date().toISOString() : null,
    }

    // Insert blog post
    const { data, error } = await supabase.from("blog_posts").insert(blogPostData).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 })
    }

    // Log the creation
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      event_type: "blog_post_created",
      resource_type: "blog_post",
      resource_id: data.id,
      details: { title: data.title, status: data.status },
    })

    return NextResponse.json({
      message: "Blog post created successfully",
      ...data,
    })
  } catch (error) {
    console.error("Blog creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "published"
    const tag = searchParams.get("tag")

    let query = supabase
      .from("blog_posts")
      .select(`
        *,
        users!blog_posts_author_id_fkey(name, image),
        companies(name)
      `)
      .order("published_at", { ascending: false })

    // Filter by status (default to published)
    query = query.eq("status", status)

    // Filter by tag if provided
    if (tag) {
      query = query.ilike("tags", `%${tag}%`)
    }

    const { data: blogPosts, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 })
    }

    return NextResponse.json({ blogPosts })
  } catch (error) {
    console.error("Fetch blog posts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
