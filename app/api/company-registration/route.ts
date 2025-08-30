import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type { CreateCompanyRegistration } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["company_name", "company_email", "company_description"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate arrays
    if (!Array.isArray(body.services_offered) || body.services_offered.length === 0) {
      return NextResponse.json({ error: "At least one service must be selected" }, { status: 400 })
    }

    if (!Array.isArray(body.operating_states) || body.operating_states.length === 0) {
      return NextResponse.json({ error: "At least one operating state must be selected" }, { status: 400 })
    }

    // Get current user (if logged in)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Prepare registration data
    const registrationData: CreateCompanyRegistration = {
      company_name: body.company_name,
      company_email: body.company_email,
      company_phone: body.company_phone || null,
      company_website: body.company_website || null,
      company_description: body.company_description,
      company_address: body.company_address || null,
      company_city: body.company_city || null,
      company_state: body.company_state || null,
      company_zip_code: body.company_zip_code || null,
      company_country: body.company_country || "United States",
      services_offered: body.services_offered.join(", "), // Convert array to comma-separated string
      operating_states: body.operating_states.join(", "), // Convert array to comma-separated string
      status: "pending",
      submitted_by: user?.id || null,
    }

    // Check if company email already exists
    const { data: existingRegistration } = await supabase
      .from("company_registrations")
      .select("id")
      .eq("company_email", registrationData.company_email)
      .single()

    if (existingRegistration) {
      return NextResponse.json({ error: "A registration with this email already exists" }, { status: 409 })
    }

    // Insert registration
    const { data, error } = await supabase.from("company_registrations").insert(registrationData).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to submit registration" }, { status: 500 })
    }

    // Log the registration submission
    if (user) {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        event_type: "company_registration_submitted",
        resource_type: "company_registration",
        resource_id: data.id,
        details: { company_name: registrationData.company_name },
      })
    }

    return NextResponse.json({
      message: "Registration submitted successfully",
      registration_id: data.id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!userProfile || userProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all company registrations
    const { data: registrations, error } = await supabase
      .from("company_registrations")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
    }

    return NextResponse.json({ registrations })
  } catch (error) {
    console.error("Fetch registrations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
