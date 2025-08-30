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
    if (!body.type || !body.item_id || typeof body.vote_type !== "boolean") {
      return NextResponse.json({ error: "Type, item_id, and vote_type are required" }, { status: 400 })
    }

    const { type, item_id, vote_type } = body

    // Prepare vote data based on type
    const voteData: any = {
      user_id: user.id,
      vote_type,
    }

    if (type === "question") {
      voteData.question_id = item_id
    } else if (type === "answer") {
      voteData.answer_id = item_id
    } else if (type === "blog") {
      voteData.blog_post_id = item_id
    } else {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 })
    }

    // Check if user already voted on this item
    let existingVoteQuery = supabase.from("votes").select("*").eq("user_id", user.id)

    if (type === "question") {
      existingVoteQuery = existingVoteQuery.eq("question_id", item_id)
    } else if (type === "answer") {
      existingVoteQuery = existingVoteQuery.eq("answer_id", item_id)
    } else if (type === "blog") {
      existingVoteQuery = existingVoteQuery.eq("blog_post_id", item_id)
    }

    const { data: existingVote } = await existingVoteQuery.single()

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Remove vote if clicking same vote type
        const { error } = await supabase.from("votes").delete().eq("id", existingVote.id)

        if (error) {
          console.error("Database error:", error)
          return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 })
        }

        return NextResponse.json({ message: "Vote removed successfully" })
      } else {
        // Update vote if changing vote type
        const { error } = await supabase.from("votes").update({ vote_type }).eq("id", existingVote.id)

        if (error) {
          console.error("Database error:", error)
          return NextResponse.json({ error: "Failed to update vote" }, { status: 500 })
        }

        return NextResponse.json({ message: "Vote updated successfully" })
      }
    } else {
      // Create new vote
      const { error } = await supabase.from("votes").insert(voteData)

      if (error) {
        console.error("Database error:", error)
        return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 })
      }

      return NextResponse.json({ message: "Vote cast successfully" })
    }
  } catch (error) {
    console.error("Vote error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
