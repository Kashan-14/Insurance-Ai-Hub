import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building, Calendar, Mail, Phone, Globe, MapPin } from "lucide-react"
import { ApproveCompanyButton } from "@/components/approve-company-button"

export default async function AdminCompaniesPage() {
  const supabase = await createClient()

  // Check authentication and admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userProfile || userProfile.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch company registrations
  const { data: registrations, error } = await supabase
    .from("company_registrations")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching registrations:", error)
  }

  const pendingRegistrations = registrations?.filter((r) => r.status === "pending") || []
  const processedRegistrations = registrations?.filter((r) => r.status !== "pending") || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Company Registrations</h1>
            </div>
            <Button asChild variant="outline">
              <a href="/dashboard">Back to Dashboard</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Registrations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Pending Approvals ({pendingRegistrations.length})</h2>
          </div>

          {pendingRegistrations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending registrations</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingRegistrations.map((registration) => (
                <Card key={registration.id} className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-orange-900">{registration.company_name}</CardTitle>
                        <CardDescription className="text-orange-700">
                          <div className="flex items-center space-x-1 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>Submitted {new Date(registration.created_at).toLocaleDateString()}</span>
                          </div>
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {registration.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{registration.company_email}</span>
                      </div>
                      {registration.company_phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{registration.company_phone}</span>
                        </div>
                      )}
                      {registration.company_website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-gray-500" />
                          <span className="truncate">{registration.company_website}</span>
                        </div>
                      )}
                      {registration.company_city && registration.company_state && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>
                            {registration.company_city}, {registration.company_state}
                          </span>
                        </div>
                      )}
                    </div>

                    {registration.company_description && (
                      <div>
                        <p className="text-sm text-gray-600 line-clamp-3">{registration.company_description}</p>
                      </div>
                    )}

                    {registration.services_offered && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {registration.services_offered
                            .split(", ")
                            .slice(0, 3)
                            .map((service) => (
                              <Badge key={service} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          {registration.services_offered.split(", ").length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{registration.services_offered.split(", ").length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <ApproveCompanyButton registrationId={registration.id} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Processed Registrations */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Processed Registrations ({processedRegistrations.length})
          </h2>

          {processedRegistrations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No processed registrations</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {processedRegistrations.map((registration) => (
                <Card key={registration.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{registration.company_name}</CardTitle>
                      <Badge
                        variant={registration.status === "approved" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {registration.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{registration.company_email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(registration.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
