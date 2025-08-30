import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, User, Phone, Mail, Building, Search, Plus, Filter } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

interface SearchParams {
  search?: string
  status?: string
  priority?: string
  assigned_to?: string
  sort?: string
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams
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

  // Build query for leads
  let query = supabase
    .from("leads")
    .select(`
      *,
      assigned_user:users!leads_assigned_to_fkey(name)
    `)
    .order("created_at", { ascending: false })

  // Apply search filter
  if (searchParams.search) {
    query = query.or(
      `name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,company_name.ilike.%${searchParams.search}%`,
    )
  }

  // Apply status filter
  if (searchParams.status) {
    query = query.eq("status", searchParams.status)
  }

  // Apply priority filter
  if (searchParams.priority) {
    query = query.eq("priority", searchParams.priority)
  }

  // Apply assigned user filter
  if (searchParams.assigned_to) {
    query = query.eq("assigned_to", searchParams.assigned_to)
  }

  // Apply sorting
  if (searchParams.sort === "priority") {
    query = query.order("priority", { ascending: false })
  } else if (searchParams.sort === "name") {
    query = query.order("name", { ascending: true })
  }

  const { data: leads, error } = await query

  if (error) {
    console.error("Error fetching leads:", error)
  }

  // Get all users for assignment filter
  const { data: users } = await supabase
    .from("users")
    .select("id, name")
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                Insurance AI Hub
              </Link>
              <span className="text-gray-400">/</span>
              <h1 className="text-xl font-semibold text-gray-900">Lead Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild>
                <Link href="/contact">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Leads</CardDescription>
              <CardTitle className="text-2xl">{leads?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>New Leads</CardDescription>
              <CardTitle className="text-2xl">{leads?.filter((l) => l.status === "new").length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Converted</CardDescription>
              <CardTitle className="text-2xl">{leads?.filter((l) => l.status === "converted").length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>High Priority</CardDescription>
              <CardTitle className="text-2xl">{leads?.filter((l) => l.priority === "high").length || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 max-w-md">
              <form method="GET" className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  name="search"
                  placeholder="Search leads..."
                  defaultValue={searchParams.search}
                  className="pl-10"
                />
                {/* Preserve other filters */}
                {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
                {searchParams.priority && <input type="hidden" name="priority" value={searchParams.priority} />}
                {searchParams.assigned_to && (
                  <input type="hidden" name="assigned_to" value={searchParams.assigned_to} />
                )}
                {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
              </form>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Status Filter */}
              <Select defaultValue={searchParams.status || "all"}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select defaultValue={searchParams.priority || "all"}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Assigned User Filter */}
              <Select defaultValue={searchParams.assigned_to || "all"}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Assigned To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Filter */}
              <Select defaultValue={searchParams.sort || "recent"}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Leads List */}
        {!leads || leads.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500">
                {searchParams.search || searchParams.status || searchParams.priority ? (
                  <div>
                    <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg mb-2">No leads found</p>
                    <p className="mb-4">Try adjusting your search or filter criteria</p>
                    <Button asChild variant="outline">
                      <Link href="/leads">View All Leads</Link>
                    </Button>
                  </div>
                ) : (
                  <div>
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg mb-2">No leads yet</p>
                    <p className="mb-4">Leads will appear here when customers submit inquiries</p>
                    <Button asChild>
                      <Link href="/contact">Add Lead</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                        <Badge className={getPriorityColor(lead.priority)}>{lead.priority} priority</Badge>
                        {lead.insurance_type && <Badge variant="outline">{lead.insurance_type}</Badge>}
                      </div>
                      <CardTitle className="text-lg mb-2 hover:text-blue-600">
                        <Link href={`/leads/${lead.id}`}>{lead.name}</Link>
                      </CardTitle>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <span>{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.company_name && (
                          <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{lead.company_name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {lead.query_details && (
                        <CardDescription className="line-clamp-2 mb-3">{lead.query_details}</CardDescription>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          <span>
                            {lead.assigned_user?.name ? `Assigned to ${lead.assigned_user.name}` : "Unassigned"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/leads/${lead.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
