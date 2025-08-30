"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare } from "lucide-react"

interface BlogReviewFormProps {
  blogPostId: string
}

export function BlogReviewForm({ blogPostId }: BlogReviewFormProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!content.trim()) {
      setError("Please enter a comment")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/blog/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blog_post_id: blogPostId,
          content: content.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to post comment")
      }

      setContent("")
      router.refresh() // Refresh to show new comment
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Leave a Comment</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts on this article..."
            rows={4}
            required
          />

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <Button type="submit" disabled={isLoading || !content.trim()}>
            {isLoading ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
