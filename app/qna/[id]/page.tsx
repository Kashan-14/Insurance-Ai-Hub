import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User, Eye, ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AnswerForm } from "@/components/answer-form"
import { AnswersList } from "@/components/answers-list"
import { VoteButtons } from "@/components/vote-buttons"

export default async function QuestionPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Get the question
  const { data: question, error } = await supabase
    .from("questions")
    .select(`
      *,
      users!questions_asked_by_fkey(name, image)
    `)
    .eq("id", params.id)
    .single()

  if (error || !question) {
    notFound()
  }

  // Increment view count
  await supabase
    .from("questions")
    .update({ views: question.views + 1 })
    .eq("id", params.id)

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get answers for this question
  const { data: answers } = await supabase
    .from("answers")
    .select(`
      *,
      users(name, image)
    `)
    .eq("question_id", question.id)
    .order("created_at", { ascending: false })

  // Get vote counts for the question
  const { data: questionVotes } = await supabase.from("votes").select("vote_type").eq("question_id", question.id)

  const questionUpvotes = questionVotes?.filter((v) => v.vote_type === true).length || 0
  const questionDownvotes = questionVotes?.filter((v) => v.vote_type === false).length || 0

  // Get user's vote on this question (if logged in)
  let userQuestionVote = null
  if (user) {
    const { data: userVote } = await supabase
      .from("votes")
      .select("vote_type")
      .eq("question_id", question.id)
      .eq("user_id", user.id)
      .single()
    userQuestionVote = userVote?.vote_type
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button asChild variant="ghost" size="sm">
              <Link href="/qna">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Q&A
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <Badge
                    variant={
                      question.status === "open" ? "default" : question.status === "answered" ? "secondary" : "outline"
                    }
                  >
                    {question.status}
                  </Badge>
                  {question.tags && (
                    <div className="flex flex-wrap gap-1">
                      {question.tags.split(", ").map((tag) => (
                        <Link key={tag} href={`/qna?tag=${encodeURIComponent(tag)}`}>
                          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100">
                            {tag}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <CardTitle className="text-2xl mb-3 text-balance">{question.title}</CardTitle>
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
                    <span>{question.views + 1} views</span>
                  </div>
                </div>
              </div>
              {user && (
                <VoteButtons
                  type="question"
                  itemId={question.id}
                  upvotes={questionUpvotes}
                  downvotes={questionDownvotes}
                  userVote={userQuestionVote}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{question.content}</p>
            </div>
          </CardContent>
        </Card>

        {/* Answers Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <MessageSquare className="w-6 h-6" />
              <span>Answers ({answers?.length || 0})</span>
            </h2>
          </div>

          {/* Answer Form */}
          {user ? (
            <div className="mb-8">
              <AnswerForm questionId={question.id} />
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-6">
                <p className="text-gray-600 mb-4">Sign in to answer this question</p>
                <Button asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Answers List */}
          <AnswersList answers={answers || []} currentUser={user} questionAuthorId={question.asked_by} />
        </div>
      </main>
    </div>
  )
}
