"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"

interface VoteButtonsProps {
  type: "question" | "answer"
  itemId: string
  upvotes: number
  downvotes: number
  userVote?: boolean | null
}

export function VoteButtons({ type, itemId, upvotes, downvotes, userVote }: VoteButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes)
  const [currentDownvotes, setCurrentDownvotes] = useState(downvotes)
  const [currentUserVote, setCurrentUserVote] = useState(userVote)
  const router = useRouter()

  const handleVote = async (voteType: boolean) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/qna/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          item_id: itemId,
          vote_type: voteType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to vote")
      }

      // Update local state optimistically
      if (currentUserVote === voteType) {
        // Remove vote
        setCurrentUserVote(null)
        if (voteType) {
          setCurrentUpvotes(currentUpvotes - 1)
        } else {
          setCurrentDownvotes(currentDownvotes - 1)
        }
      } else {
        // Add or change vote
        if (currentUserVote !== null) {
          // Changing vote
          if (currentUserVote) {
            setCurrentUpvotes(currentUpvotes - 1)
            setCurrentDownvotes(currentDownvotes + 1)
          } else {
            setCurrentDownvotes(currentDownvotes - 1)
            setCurrentUpvotes(currentUpvotes + 1)
          }
        } else {
          // New vote
          if (voteType) {
            setCurrentUpvotes(currentUpvotes + 1)
          } else {
            setCurrentDownvotes(currentDownvotes + 1)
          }
        }
        setCurrentUserVote(voteType)
      }

      router.refresh()
    } catch (error) {
      console.error("Vote error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <Button
        variant={currentUserVote === true ? "default" : "ghost"}
        size="sm"
        onClick={() => handleVote(true)}
        disabled={isLoading}
        className="h-8 w-8 p-0"
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>
      <span className="text-sm font-medium text-gray-600">{currentUpvotes - currentDownvotes}</span>
      <Button
        variant={currentUserVote === false ? "destructive" : "ghost"}
        size="sm"
        onClick={() => handleVote(false)}
        disabled={isLoading}
        className="h-8 w-8 p-0"
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>
    </div>
  )
}
