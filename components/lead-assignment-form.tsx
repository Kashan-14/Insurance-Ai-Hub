"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  name: string | null
  email: string
}

interface LeadAssignmentFormProps {
  leadId: string
  currentAssignee: string | null
  users: User[]
}

export function LeadAssignmentForm({ leadId, currentAssignee, users }: LeadAssignmentFormProps) {
  const [assignedTo, setAssignedTo] = useState(currentAssignee || "unassigned")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigned_to: assignedTo === "unassigned" ? null : assignedTo,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign lead")
      }

      router.refresh()
    } catch (error) {
      console.error("Assignment error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Assign To</Label>
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger>
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Assigning..." : "Assign"}
      </Button>
    </form>
  )
}
