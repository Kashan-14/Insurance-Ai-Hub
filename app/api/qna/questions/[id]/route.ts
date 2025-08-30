import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type { UpdateQuestion } from "@/lib/types/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: question, error } = await supabase
      .from("questions")
      .select(`
        *,
        users(name, image),
        answers(*, users(name, image))
      `)
      .eq("id", params.id)
      .single()

    if (error || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Increment view count
    await supabase.rpc("increment_question_views", { question_id: params.id })

    return NextResponse.json({ question })
  } catch (error) {
    console.error("Fetch question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { data: existingQuestion } = await supabase.from("questions").select("asked_by").eq("id", params.id).single()

    if (!userProfile || !existingQuestion || (!(userProfile.role === "admin") && existingQuestion.asked_by !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prepare update data
    const updateData: UpdateQuestion = {
      title: body.title,
      content: body.content,
      tags: body.tags || null,
      is_anonymous: body.is_anonymous || false,
      status: body.status,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("questions").update(updateData).eq("id", params.id).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
    }

    // Log the update
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      event_type: "question_updated",
      resource_type: "question",
      resource_id: data.id,
      details: { title: data.title, status: data.status },
    })

    return NextResponse.json({ message: "Question updated successfully", ...data })
  } catch (error) {
    console.error("Question update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { data: existingQuestion } = await supabase.from("questions").select("asked_by").eq("id", params.id).single()

    if (!userProfile || !existingQuestion || (!(userProfile.role === "admin") && existingQuestion.asked_by !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await supabase.from("questions").delete().eq("id", params.id)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
    }

    // Log the deletion
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      event_type: "question_deleted",
      resource_type: "question",
      resource_id: params.id,
      details: { question_id: params.id },
    })

    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Question deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
