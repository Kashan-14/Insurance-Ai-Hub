import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type { UpdateBlogPost } from "@/lib/types/database"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = await createClient()

    const { data: blogPost, error } = await supabase
      .from("blog_posts")
      .select(`
        *,
        users!blog_posts_author_id_fkey(name, image),
        companies(name)
      `)
      .eq("slug", params.slug)
      .single()

    if (error || !blogPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    return NextResponse.json({ blogPost })
  } catch (error) {
    console.error("Fetch blog post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
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

    // Check user role and ownership
    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()
    const { data: existingPost } = await supabase.from("blog_posts").select("id, author_id").eq("slug", params.slug).single()

    if (!userProfile || !existingPost || (!(userProfile.role === "admin") && existingPost.author_id !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validate required fields for update
    if (!body.title || !body.content || !body.slug) {
      return NextResponse.json({ error: "Title, content, and slug are required" }, { status: 400 })
    }

    // Prepare update data
    const updateData: UpdateBlogPost = {
      title: body.title,
      slug: body.slug,
      content: body.content,
      excerpt: body.excerpt || null,
      cover_image_url: body.cover_image_url || null,
      tags: body.tags || null,
      status: body.status || "draft",
      published_at: body.status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("blog_posts").update(updateData).eq("slug", params.slug).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 })
    }

    // Log the update
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      event_type: "blog_post_updated",
      resource_type: "blog_post",
      resource_id: data.id,
      details: { title: data.title, status: data.status },
    })

    return NextResponse.json({ message: "Blog post updated successfully", ...data })
  } catch (error) {
    console.error("Blog update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role and ownership
    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()
    const { data: existingPost } = await supabase.from("blog_posts").select("id, author_id").eq("slug", params.slug).single()

    if (!userProfile || !existingPost || (!(userProfile.role === "admin") && existingPost.author_id !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await supabase.from("blog_posts").delete().eq("slug", params.slug)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 })
    }

    // Log the deletion
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      event_type: "blog_post_deleted",
      resource_type: "blog_post",
      resource_id: existingPost.id,
      details: { slug: params.slug },
    })

    return NextResponse.json({ message: "Blog post deleted successfully" })
  } catch (error) {
    console.error("Blog deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
