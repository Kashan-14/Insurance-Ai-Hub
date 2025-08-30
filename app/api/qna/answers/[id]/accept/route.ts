import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the answer and verify permissions
    const { data: answer } = await supabase
      .from("answers")
      .select(`
        *,
        questions!inner(asked_by, status)
      `)
      .eq("id", params.id)
      .single()

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 })
    }

    // Check if user is the question author or admin
    const { data: currentUser } = await supabase.from("users").select("role").eq("id", user.id).single()

    const isQuestionAuthor = answer.questions.asked_by === user.id
    const isAdmin = currentUser?.role === "admin"

    if (!isQuestionAuthor && !isAdmin) {
      return NextResponse.json({ error: "Only the question author or admin can accept answers" }, { status: 403 })
    }

    // Unaccept any previously accepted answers for this question
    await supabase.from("answers").update({ is_accepted: false }).eq("question_id", answer.question_id)

    // Accept this answer
    const { error } = await supabase.from("answers").update({ is_accepted: true }).eq("id", params.id)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to accept answer" }, { status: 500 })
    }

    // Update question status to answered
    await supabase.from("questions").update({ status: "answered" }).eq("id", answer.question_id)

    // Log the action
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      event_type: "answer_accepted",
      resource_type: "answer",
      resource_id: params.id,
      details: { question_id: answer.question_id },
    })

    return NextResponse.json({ message: "Answer accepted successfully" })
  } catch (error) {
    console.error("Accept answer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
