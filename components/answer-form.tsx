"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare } from "lucide-react"

interface AnswerFormProps {
  questionId: string
}

export function AnswerForm({ questionId }: AnswerFormProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!content.trim()) {
      setError("Please enter an answer")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/qna/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: questionId,
          content: content.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to post answer")
      }

      setContent("")
      router.refresh() // Refresh to show new answer
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
          <span>Your Answer</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your knowledge and help answer this question..."
            rows={6}
            required
          />

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Tips for great answers:</strong> Be specific, provide examples, cite sources when possible, and
              explain your reasoning.
            </p>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <Button type="submit" disabled={isLoading || !content.trim()}>
            {isLoading ? "Posting..." : "Post Answer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
