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
    if (!body.question_id || !body.content) {
      return NextResponse.json({ error: "Question ID and content are required" }, { status: 400 })
    }

    // Verify question exists
    const { data: question } = await supabase.from("questions").select("id, status").eq("id", body.question_id).single()

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (question.status === "closed") {
      return NextResponse.json({ error: "Cannot answer closed questions" }, { status: 400 })
    }

    // Insert answer
    const { data, error } = await supabase
      .from("answers")
      .insert({
        content: body.content,
        question_id: body.question_id,
        answered_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to post answer" }, { status: 500 })
    }

    // Update question status to answered if it was open
    if (question.status === "open") {
      await supabase.from("questions").update({ status: "answered" }).eq("id", body.question_id)
    }

    // Log the answer submission
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      event_type: "answer_submitted",
      resource_type: "answer",
      resource_id: data.id,
      details: { question_id: body.question_id },
    })

    return NextResponse.json({
      message: "Answer posted successfully",
      answer: data,
    })
  } catch (error) {
    console.error("Answer submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
