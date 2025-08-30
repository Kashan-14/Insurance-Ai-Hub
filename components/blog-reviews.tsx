import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "lucide-react"

interface Review {
  id: string
  content: string
  created_at: string
  users: {
    name: string | null
    image: string | null
  } | null
}

interface BlogReviewsProps {
  reviews: Review[]
}

export function BlogReviews({ reviews }: BlogReviewsProps) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={review.users?.image || undefined} />
                <AvatarFallback>{review.users?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{review.users?.name || "Anonymous"}</span>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-gray-700 whitespace-pre-wrap">{review.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
