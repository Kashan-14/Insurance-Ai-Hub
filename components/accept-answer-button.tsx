"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface AcceptAnswerButtonProps {
  answerId: string
  isAccepted: boolean
  canAccept: boolean
}

export function AcceptAnswerButton({ answerId, isAccepted, canAccept }: AcceptAnswerButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  if (!canAccept || isAccepted) {
    return null
  }

  const handleAccept = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/qna/answers/${answerId}/accept`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to accept answer")
      }

      router.refresh()
    } catch (error) {
      console.error("Accept answer error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAccept}
      disabled={isLoading}
      className="text-green-600 hover:text-green-700 hover:bg-green-50 bg-transparent"
    >
      <CheckCircle className="w-4 h-4 mr-1" />
      {isLoading ? "Accepting..." : "Accept Answer"}
    </Button>
  )
}
