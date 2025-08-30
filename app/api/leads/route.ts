import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type { CreateLead } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.query_details) {
      return NextResponse.json({ error: "Name, email, and query details are required" }, { status: 400 })
    }

    // Prepare lead data
    const leadData: CreateLead = {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      company_name: body.company_name || null,
      insurance_type: body.insurance_type || null,
      query_details: body.query_details,
      status: "new",
      priority: body.priority || "medium",
      source: body.source || "website_form",
      assigned_to: null,
    }

    // Insert lead
    const { data, error } = await supabase.from("leads").insert(leadData).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to submit lead" }, { status: 500 })
    }

    // Create notification for admins
    const { data: admins } = await supabase.from("users").select("id").in("role", ["admin", "company_admin"])

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        type: "new_lead",
        message: `New lead submitted by ${data.name}`,
      }))

      await supabase.from("notifications").insert(notifications)
    }

    // Log the lead submission
    await supabase.from("audit_logs").insert({
      user_id: null,
      event_type: "lead_submitted",
      resource_type: "lead",
      resource_id: data.id,
      details: { name: data.name, email: data.email },
    })

    return NextResponse.json({
      message: "Lead submitted successfully",
      lead: data,
    })
  } catch (error) {
    console.error("Lead submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    // Get leads
    const { data: leads, error } = await supabase
      .from("leads")
      .select(`
        *,
        assigned_user:users!leads_assigned_to_fkey(name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }

    return NextResponse.json({ leads })
  } catch (error) {
    console.error("Leads fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
