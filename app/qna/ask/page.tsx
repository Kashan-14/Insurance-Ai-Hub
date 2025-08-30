"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function AskQuestionPage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
    is_anonymous: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.title || !formData.content) {
      setError("Title and content are required")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/qna/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit question")
      }

      const result = await response.json()
      router.push(`/qna/${result.question.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span>Ask a Question</span>
            </CardTitle>
            <CardDescription>
              Get help from the insurance community. Be specific and provide context for better answers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Question Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="What's your insurance question?"
                  required
                />
                <p className="text-xs text-gray-500">Be specific and summarize your problem in one sentence</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Question Details *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  placeholder="Provide more details about your question. Include relevant context, what you've tried, and what specific help you need."
                  rows={8}
                  required
                />
                <p className="text-xs text-gray-500">The more details you provide, the better answers you'll receive</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  placeholder="auto insurance, claims, health insurance (comma-separated)"
                />
                <p className="text-xs text-gray-500">Add relevant tags to help others find and answer your question</p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_anonymous"
                  checked={formData.is_anonymous}
                  onCheckedChange={(checked) => handleInputChange("is_anonymous", checked as boolean)}
                />
                <Label htmlFor="is_anonymous" className="text-sm font-normal cursor-pointer">
                  Ask anonymously
                </Label>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-blue-900 mb-2">Tips for getting great answers:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Be specific about your situation and insurance needs</li>
                  <li>• Include relevant details like your location, age, or coverage type</li>
                  <li>• Explain what you've already tried or researched</li>
                  <li>• Use clear, descriptive tags to categorize your question</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/qna")} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Submitting..." : "Ask Question"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
