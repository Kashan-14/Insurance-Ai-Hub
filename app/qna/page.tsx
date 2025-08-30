import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Eye, Calendar, Search, Plus, User } from "lucide-react"
import Link from "next/link"

interface SearchParams {
  search?: string
  tag?: string
  status?: string
  sort?: string
}

export default async function QnAPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  // Build query for questions
  let query = supabase
    .from("questions")
    .select(`
      *,
      users!questions_asked_by_fkey(name),
      answers(id)
    `)
    .order("created_at", { ascending: false })

  // Apply search filter
  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,content.ilike.%${searchParams.search}%`)
  }

  // Apply tag filter
  if (searchParams.tag) {
    query = query.ilike("tags", `%${searchParams.tag}%`)
  }

  // Apply status filter
  if (searchParams.status) {
    query = query.eq("status", searchParams.status)
  }

  // Apply sorting
  if (searchParams.sort === "views") {
    query = query.order("views", { ascending: false })
  } else if (searchParams.sort === "answers") {
    // This would need a more complex query in production
    query = query.order("created_at", { ascending: false })
  }

  const { data: questions, error } = await query

  if (error) {
    console.error("Error fetching questions:", error)
  }

  // Get all unique tags for filter
  const { data: allQuestions } = await supabase.from("questions").select("tags")
  const allTags = Array.from(
    new Set(allQuestions?.flatMap((q) => q.tags?.split(", ").filter(Boolean) || []).filter(Boolean) || []),
  ).sort()

  // Get current user for conditional rendering
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                Insurance AI Hub
              </Link>
              <span className="text-gray-400">/</span>
              <h1 className="text-xl font-semibold text-gray-900">Q&A Forum</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild>
                <Link href="/qna/ask">
                  <Plus className="w-4 h-4 mr-2" />
                  Ask Question
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
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Insurance Q&A Community</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get answers to your insurance questions from experts and community members
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 max-w-md">
              <form method="GET" className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  name="search"
                  placeholder="Search questions..."
                  defaultValue={searchParams.search}
                  className="pl-10"
                />
                {/* Preserve other filters */}
                {searchParams.tag && <input type="hidden" name="tag" value={searchParams.tag} />}
                {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Filter */}
              <Select defaultValue={searchParams.sort || "recent"}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="answers">Most Answers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tag Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/qna">
              <Badge variant={!searchParams.tag ? "default" : "outline"} className="cursor-pointer">
                All Topics
              </Badge>
            </Link>
            {allTags.slice(0, 8).map((tag) => (
              <Link key={tag} href={`/qna?tag=${encodeURIComponent(tag)}`}>
                <Badge variant={searchParams.tag === tag ? "default" : "outline"} className="cursor-pointer">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Questions List */}
        {!questions || questions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500">
                {searchParams.search || searchParams.tag || searchParams.status ? (
                  <div>
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg mb-2">No questions found</p>
                    <p className="mb-4">Try adjusting your search or filter criteria</p>
                    <Button asChild variant="outline">
                      <Link href="/qna">View All Questions</Link>
                    </Button>
                  </div>
                ) : (
                  <div>
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg mb-2">No questions yet</p>
                    <p className="mb-4">Be the first to ask a question!</p>
                    <Button asChild>
                      <Link href="/qna/ask">Ask Question</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge
                          variant={
                            question.status === "open"
                              ? "default"
                              : question.status === "answered"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {question.status}
                        </Badge>
                        {question.tags && (
                          <div className="flex flex-wrap gap-1">
                            {question.tags
                              .split(", ")
                              .slice(0, 2)
                              .map((tag) => (
                                <Link key={tag} href={`/qna?tag=${encodeURIComponent(tag)}`}>
                                  <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100">
                                    {tag}
                                  </Badge>
                                </Link>
                              ))}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg mb-2 hover:text-blue-600">
                        <Link href={`/qna/${question.id}`}>{question.title}</Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mb-3">{question.content}</CardDescription>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{question.is_anonymous ? "Anonymous" : question.users?.name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(question.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{question.views} views</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{question.answers?.length || 0} answers</span>
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
