import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User, Phone, Mail, Building, ArrowLeft, Globe } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { LeadStatusForm } from "@/components/lead-status-form"
import { LeadAssignmentForm } from "@/components/lead-assignment-form"

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Check authentication and permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: currentUser } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!currentUser || !["admin", "company_admin", "company_user"].includes(currentUser.role)) {
    redirect("/dashboard")
  }

  // Get the lead
  const { data: lead, error } = await supabase
    .from("leads")
    .select(`
      *,
      assigned_user:users!leads_assigned_to_fkey(name, email)
    `)
    .eq("id", params.id)
    .single()

  if (error || !lead) {
    notFound()
  }

  // Get all users for assignment
  const { data: users } = await supabase
    .from("users")
    .select("id, name, email")
    .in("role", ["admin", "company_admin", "company_user"])
    .order("name")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "contacted":
        return "bg-yellow-100 text-yellow-800"
      case "converted":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-orange-100 text-orange-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button asChild variant="ghost" size="sm">
              <Link href="/leads">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                      <Badge className={getPriorityColor(lead.priority)}>{lead.priority} priority</Badge>
                      {lead.insurance_type && <Badge variant="outline">{lead.insurance_type}</Badge>}
                    </div>
                    <CardTitle className="text-2xl mb-2">{lead.name}</CardTitle>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Submitted on {new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.company_name && (
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span>{lead.company_name}</span>
                    </div>
                  )}
                  {lead.source && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span>Source: {lead.source}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Query Details */}
            {lead.query_details && (
              <Card>
                <CardHeader>
                  <CardTitle>Query Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.query_details}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>
                      {lead.assigned_user?.name ? (
                        <span>
                          Assigned to <strong>{lead.assigned_user.name}</strong>
                        </span>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </span>
                  </div>
                  <LeadAssignmentForm leadId={lead.id} currentAssignee={lead.assigned_to} users={users || []} />
                </div>
              </CardContent>
            </Card>

            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status & Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadStatusForm leadId={lead.id} currentStatus={lead.status} currentPriority={lead.priority} />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full bg-transparent" variant="outline">
                  <a href={`mailto:${lead.email}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </a>
                </Button>
                {lead.phone && (
                  <Button asChild className="w-full bg-transparent" variant="outline">
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
