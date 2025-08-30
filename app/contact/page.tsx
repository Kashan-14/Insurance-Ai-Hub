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
import { Phone, Mail, MessageSquare } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    insurance_type: "",
    query_details: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.name || !formData.email || !formData.query_details) {
      setError("Name, email, and query details are required")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          source: "website_form",
          priority: "medium",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit inquiry")
      }

      setSuccess(true)
      setFormData({
        name: "",
        email: "",
        phone: "",
        company_name: "",
        insurance_type: "",
        query_details: "",
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-green-900">Thank You!</CardTitle>
            <CardDescription>
              Your inquiry has been submitted successfully. Our team will get back to you within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setSuccess(false)} className="w-full">
              Submit Another Inquiry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Contact Us</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Get Insurance Quote</CardTitle>
                <CardDescription>
                  Fill out the form below and our insurance experts will get back to you with personalized
                  recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange("company_name", e.target.value)}
                        placeholder="Acme Corp"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_type">Insurance Type</Label>
                    <Select
                      value={formData.insurance_type}
                      onValueChange={(value) => handleInputChange("insurance_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select insurance type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto Insurance</SelectItem>
                        <SelectItem value="home">Home Insurance</SelectItem>
                        <SelectItem value="life">Life Insurance</SelectItem>
                        <SelectItem value="health">Health Insurance</SelectItem>
                        <SelectItem value="business">Business Insurance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="query_details">Tell us about your insurance needs *</Label>
                    <Textarea
                      id="query_details"
                      value={formData.query_details}
                      onChange={(e) => handleInputChange("query_details", e.target.value)}
                      placeholder="Please describe your insurance needs, current coverage, budget, or any specific questions you have..."
                      rows={6}
                      required
                    />
                  </div>

                  {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Submitting..." : "Get Quote"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>Have questions? Our insurance experts are here to help.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Call Us</p>
                    <p className="text-sm text-gray-600">(555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email Us</p>
                    <p className="text-sm text-gray-600">info@insuranceaihub.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Choose Us?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Expert insurance advice</li>
                  <li>• Competitive rates</li>
                  <li>• 24/7 customer support</li>
                  <li>• Quick quote processing</li>
                  <li>• Personalized coverage options</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
