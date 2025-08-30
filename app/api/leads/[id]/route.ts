import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check permissions
    const { data: currentUser } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!currentUser || !["admin", "company_admin", "company_user"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update lead
    const { data, error } = await supabase.from("leads").update(body).eq("id", params.id).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
    }

    // Log the update
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      event_type: "lead_updated",
      resource_type: "lead",
      resource_id: params.id,
      details: body,
    })

    return NextResponse.json({
      message: "Lead updated successfully",
      lead: data,
    })
  } catch (error) {
    console.error("Lead update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
