import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, Building, FileText, MessageSquare, Users, Bot } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile with role information
  const { data: userProfile } = await supabase.from("users").select("*").eq("id", data.user.id).single()

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  const dashboardCards = [
    {
      title: "Blog Management",
      description: "Create and manage blog posts",
      icon: FileText,
      href: "/blog",
      roles: ["admin", "blog_author"],
    },
    {
      title: "Q&A Forum",
      description: "Browse and answer questions",
      icon: MessageSquare,
      href: "/qna",
      roles: ["customer", "admin", "blog_author", "company_admin", "company_user"],
    },
    {
      title: "Lead Management",
      description: "Manage insurance leads",
      icon: Users,
      href: "/leads",
      roles: ["admin", "company_admin", "company_user"],
    },
    {
      title: "Company Registration",
      description: "Register your insurance company",
      icon: Building,
      href: "/company-registration",
      roles: ["customer"],
    },
    {
      title: "AI Assistant",
      description: "Get insurance advice from AI",
      icon: Bot,
      href: "/ai-assistant",
      roles: ["customer", "admin", "blog_author", "company_admin", "company_user"],
    },
  ]

  const userRole = userProfile?.role || "customer"
  const availableCards = dashboardCards.filter((card) => card.roles.includes(userRole))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Insurance AI Hub</h1>
              <span className="text-sm text-gray-500">Welcome, {userProfile?.name || data.user.email}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{userRole}</span>
              <form action={handleSignOut}>
                <Button variant="ghost" size="sm" type="submit">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Access your Insurance AI Hub features and tools</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{card.description}</CardDescription>
                  <Button asChild className="w-full">
                    <a href={card.href}>Access Feature</a>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {userRole === "admin" && (
          <div className="mt-8">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800">Admin Panel</CardTitle>
                <CardDescription className="text-orange-700">
                  Administrative functions and system management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button asChild variant="outline">
                    <a href="/admin/companies">Manage Companies</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/admin/users">Manage Users</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
