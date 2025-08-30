import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type { CreateQuestion } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Get current user (optional for anonymous questions)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Prepare question data
    const questionData: CreateQuestion = {
      title: body.title,
      content: body.content,
      tags: body.tags || null,
      is_anonymous: body.is_anonymous || false,
      asked_by: body.is_anonymous ? null : user?.id || null,
      status: "open",
    }

    // Insert question
    const { data, error } = await supabase.from("questions").insert(questionData).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to submit question" }, { status: 500 })
    }

    // Log the question submission
    if (user && !body.is_anonymous) {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        event_type: "question_submitted",
        resource_type: "question",
        resource_id: data.id,
        details: { title: data.title },
      })
    }

    return NextResponse.json({
      message: "Question submitted successfully",
      question: data,
    })
  } catch (error) {
    console.error("Question submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "open"
    const tag = searchParams.get("tag")

    let query = supabase
      .from("questions")
      .select(`
        *,
        users(name, image)
      `)
      .order("created_at", { ascending: false })

    // Filter by status
    query = query.eq("status", status)

    // Filter by tag if provided
    if (tag) {
      query = query.ilike("tags", `%${tag}%`)
    }

    const { data: questions, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
    }

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Fetch questions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
