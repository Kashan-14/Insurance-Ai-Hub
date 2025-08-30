import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, CheckCircle } from "lucide-react"
import { VoteButtons } from "@/components/vote-buttons"
import { AcceptAnswerButton } from "@/components/accept-answer-button"
import { createClient } from "@/lib/supabase/server"

interface Answer {
  id: string
  content: string
  created_at: string
  is_accepted: boolean
  question_id: string
  users: {
    name: string | null
    image: string | null
  } | null
}

interface AnswersListProps {
  answers: Answer[]
  currentUser: any
  questionAuthorId?: string | null
}

export async function AnswersList({ answers, currentUser, questionAuthorId }: AnswersListProps) {
  const supabase = await createClient()

  if (answers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No answers yet. Be the first to help!</p>
        </CardContent>
      </Card>
    )
  }

  // Get vote data for all answers
  const answerIds = answers.map((a) => a.id)
  const { data: allVotes } = await supabase.from("votes").select("*").in("answer_id", answerIds)

  // Get user's votes if logged in
  let userVotes: Record<string, boolean> = {}
  if (currentUser) {
    const userVoteData = allVotes?.filter((v) => v.user_id === currentUser.id) || []
    userVotes = userVoteData.reduce(
      (acc, vote) => {
        if (vote.answer_id) {
          acc[vote.answer_id] = vote.vote_type
        }
        return acc
      },
      {} as Record<string, boolean>,
    )
  }

  // Calculate vote counts for each answer
  const voteCounts = answerIds.reduce(
    (acc, answerId) => {
      const answerVotes = allVotes?.filter((v) => v.answer_id === answerId) || []
      acc[answerId] = {
        upvotes: answerVotes.filter((v) => v.vote_type === true).length,
        downvotes: answerVotes.filter((v) => v.vote_type === false).length,
      }
      return acc
    },
    {} as Record<string, { upvotes: number; downvotes: number }>,
  )

  // Check if current user can accept answers
  const canAcceptAnswers = currentUser && (currentUser.id === questionAuthorId || currentUser.role === "admin")

  // Sort answers: accepted first, then by creation date
  const sortedAnswers = [...answers].sort((a, b) => {
    if (a.is_accepted && !b.is_accepted) return -1
    if (!a.is_accepted && b.is_accepted) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="space-y-4">
      {sortedAnswers.map((answer) => (
        <Card key={answer.id} className={answer.is_accepted ? "border-green-200 bg-green-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={answer.users?.image || undefined} />
                  <AvatarFallback>{answer.users?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{answer.users?.name || "Anonymous"}</span>
                    {answer.is_accepted && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Accepted Answer
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(answer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {currentUser && (
                  <VoteButtons
                    type="answer"
                    itemId={answer.id}
                    upvotes={voteCounts[answer.id]?.upvotes || 0}
                    downvotes={voteCounts[answer.id]?.downvotes || 0}
                    userVote={userVotes[answer.id]}
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{answer.content}</p>
            </div>
            {canAcceptAnswers && (
              <div className="mt-4 pt-3 border-t">
                <AcceptAnswerButton answerId={answer.id} isAccepted={answer.is_accepted} canAccept={true} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
