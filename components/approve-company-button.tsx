"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ApproveCompanyButtonProps {
  registrationId: string
}

export function ApproveCompanyButton({ registrationId }: ApproveCompanyButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleApprove = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/companies/${registrationId}/approve`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to approve registration")
      }

      const result = await response.json()

      // Show success message or redirect
      router.refresh() // Refresh the page to show updated status
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex space-x-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Approve
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Company Registration</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a company record and generate admin credentials. The company will be able to access the
              platform immediately. Are you sure you want to approve this registration?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isLoading}>
              {isLoading ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button variant="destructive" className="flex-1" disabled={isLoading}>
        <X className="w-4 h-4 mr-2" />
        Reject
      </Button>

      {error && <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
    </div>
  )
}
