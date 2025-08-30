import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, MessageSquare, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { AIChat } from "@/components/ai-chat"

export default async function AIAssistantPage() {
  const supabase = await createClient()

  // Get current user (optional for AI assistant)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProfile = null
  if (user) {
    const { data } = await supabase.from("users").select("name, role").eq("id", user.id).single()
    userProfile = data
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/qna">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Q&A Forum
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Insurance Assistant</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get instant answers to your insurance questions from our AI-powered assistant. Ask about coverage options,
            claims, policies, and more.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Instant Answers</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Get immediate responses to your insurance questions, available 24/7
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Expert Knowledge</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Powered by comprehensive insurance knowledge and industry best practices
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <Bot className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Personalized Help</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Tailored responses based on your specific insurance needs and situation
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* AI Chat Interface */}
        <AIChat user={user} userProfile={userProfile} />

        {/* Additional Help */}
        <div className="mt-8 text-center">
          <Card>
            <CardContent className="py-6">
              <p className="text-gray-600 mb-4">Need more detailed help or want to connect with our community?</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline">
                  <Link href="/qna">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask in Q&A Forum
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">
                    <Bot className="w-4 h-4 mr-2" />
                    Contact Expert
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
