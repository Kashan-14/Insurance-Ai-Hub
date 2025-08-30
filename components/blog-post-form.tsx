"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BlogStatus } from "@/lib/types/database"

interface BlogPostFormProps {
  userId: string
  companyId?: string | null
  initialData?: {
    id: string
    title: string
    content: string
    excerpt?: string
    cover_image_url?: string
    tags?: string
    status: BlogStatus
  }
}

export function BlogPostForm({ userId, companyId, initialData }: BlogPostFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    excerpt: initialData?.excerpt || "",
    cover_image_url: initialData?.cover_image_url || "",
    tags: initialData?.tags || "",
    status: initialData?.status || ("draft" as BlogStatus),
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleInputChange = (field: string, value: string) => {
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
      const slug = generateSlug(formData.title)
      const endpoint = initialData ? `/api/blog/${initialData.id}` : "/api/blog"
      const method = initialData ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          slug,
          author_id: userId,
          company_id: companyId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save article")
      }

      const result = await response.json()

      if (formData.status === "published") {
        router.push(`/blog/${result.slug}`)
      } else {
        router.push("/blog/manage")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Article" : "Create New Article"}</CardTitle>
        <CardDescription>
          {initialData ? "Update your article content" : "Share your insurance insights with the community"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter article title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => handleInputChange("excerpt", e.target.value)}
              placeholder="Brief summary of the article (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_image_url">Cover Image URL</Label>
            <Input
              id="cover_image_url"
              type="url"
              value={formData.cover_image_url}
              onChange={(e) => handleInputChange("cover_image_url", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
              placeholder="auto insurance, health insurance, tips (comma-separated)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="Write your article content here..."
              rows={15}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: BlogStatus) => handleInputChange("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="button" variant="outline" onClick={() => router.push("/blog/manage")} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : initialData ? "Update Article" : "Create Article"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
