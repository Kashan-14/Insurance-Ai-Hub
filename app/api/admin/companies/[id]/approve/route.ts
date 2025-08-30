import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get the registration details
    const { data: registration, error: fetchError } = await supabase
      .from("company_registrations")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (registration.status !== "pending") {
      return NextResponse.json({ error: "Registration has already been processed" }, { status: 400 })
    }

    // Start a transaction-like process
    // 1. Create the company record
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: registration.company_name,
        email: registration.company_email,
        phone: registration.company_phone,
        website: registration.company_website,
        description: registration.company_description,
        address: registration.company_address,
        city: registration.company_city,
        state: registration.company_state,
        zip_code: registration.company_zip_code,
        country: registration.company_country,
        services_offered: registration.services_offered,
        operating_states: registration.operating_states,
        status: "approved",
      })
      .select()
      .single()

    if (companyError) {
      console.error("Company creation error:", companyError)
      return NextResponse.json({ error: "Failed to create company record" }, { status: 500 })
    }

    // 2. Create company_admin user in auth.users
    const tempPassword = Math.random().toString(36).slice(-12) + "A1!" // Generate secure temp password

    // Use service role to create user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: registration.company_email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: `${registration.company_name} Admin`,
        role: "company_admin",
        company_id: company.id,
      },
    })

    if (authError) {
      console.error("Auth user creation error:", authError)
      // Rollback company creation
      await supabase.from("companies").delete().eq("id", company.id)
      return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 })
    }

    // 3. Update the registration status
    const { error: updateError } = await supabase
      .from("company_registrations")
      .update({ status: "approved" })
      .eq("id", params.id)

    if (updateError) {
      console.error("Registration update error:", updateError)
      // Note: In a real app, you'd want proper transaction handling here
    }

    // 4. Log the approval
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      event_type: "company_registration_approved",
      resource_type: "company_registration",
      resource_id: params.id,
      details: {
        company_name: registration.company_name,
        company_id: company.id,
        admin_user_id: authUser.user?.id,
      },
    })

    // 5. Create a notification for the new admin (if they have a user profile)
    if (authUser.user) {
      await supabase.from("notifications").insert({
        user_id: authUser.user.id,
        type: "company_approved",
        message: `Your company "${registration.company_name}" has been approved! Your temporary password is: ${tempPassword}. Please change it after your first login.`,
      })
    }

    return NextResponse.json({
      message: "Company registration approved successfully",
      company_id: company.id,
      admin_user_id: authUser.user?.id,
      temporary_password: tempPassword,
    })
  } catch (error) {
    console.error("Approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
