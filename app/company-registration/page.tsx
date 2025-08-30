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
import { Building, MapPin, Globe, FileText } from "lucide-react"

const INSURANCE_SERVICES = [
  "Auto Insurance",
  "Home Insurance",
  "Life Insurance",
  "Health Insurance",
  "Business Insurance",
  "Travel Insurance",
  "Disability Insurance",
  "Umbrella Insurance",
]

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
]

export default function CompanyRegistrationPage() {
  const [formData, setFormData] = useState({
    company_name: "",
    company_email: "",
    company_phone: "",
    company_website: "",
    company_description: "",
    company_address: "",
    company_city: "",
    company_state: "",
    company_zip_code: "",
    company_country: "United States",
    services_offered: [] as string[],
    operating_states: [] as string[],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field: "services_offered" | "operating_states", value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter((item) => item !== value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Basic validation
    if (!formData.company_name || !formData.company_email || !formData.company_description) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    if (formData.services_offered.length === 0) {
      setError("Please select at least one insurance service")
      setIsLoading(false)
      return
    }

    if (formData.operating_states.length === 0) {
      setError("Please select at least one operating state")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/company-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Registration failed")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Building className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Registration Submitted!</CardTitle>
            <CardDescription className="text-gray-600">
              Thank you for your interest in joining our platform
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Your company registration has been submitted successfully. Our team will review your application and
              contact you within 2-3 business days.
            </p>
            <p className="text-xs text-gray-500">Redirecting to homepage...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Your Insurance Company</h1>
          <p className="text-gray-600">Join our network of trusted insurance providers</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Company Information</span>
            </CardTitle>
            <CardDescription>Please provide accurate information about your insurance company</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Company Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_email">
                    Business Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => handleInputChange("company_email", e.target.value)}
                    placeholder="business@company.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_phone">Phone Number</Label>
                  <Input
                    id="company_phone"
                    type="tel"
                    value={formData.company_phone}
                    onChange={(e) => handleInputChange("company_phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_website">Website</Label>
                  <Input
                    id="company_website"
                    type="url"
                    value={formData.company_website}
                    onChange={(e) => handleInputChange("company_website", e.target.value)}
                    placeholder="https://www.company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_description">
                  Company Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="company_description"
                  value={formData.company_description}
                  onChange={(e) => handleInputChange("company_description", e.target.value)}
                  placeholder="Describe your company, services, and what makes you unique..."
                  rows={4}
                  required
                />
              </div>

              {/* Address Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                  Business Address
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_address">Street Address</Label>
                    <Input
                      id="company_address"
                      value={formData.company_address}
                      onChange={(e) => handleInputChange("company_address", e.target.value)}
                      placeholder="123 Business St"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_city">City</Label>
                      <Input
                        id="company_city"
                        value={formData.company_city}
                        onChange={(e) => handleInputChange("company_city", e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_state">State</Label>
                      <Input
                        id="company_state"
                        value={formData.company_state}
                        onChange={(e) => handleInputChange("company_state", e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_zip_code">ZIP Code</Label>
                      <Input
                        id="company_zip_code"
                        value={formData.company_zip_code}
                        onChange={(e) => handleInputChange("company_zip_code", e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Offered */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  Insurance Services <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {INSURANCE_SERVICES.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service}`}
                        checked={formData.services_offered.includes(service)}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("services_offered", service, checked as boolean)
                        }
                      />
                      <Label htmlFor={`service-${service}`} className="text-sm font-normal cursor-pointer">
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operating States */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="w-5 h-5 text-blue-600 mr-2" />
                  Operating States <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {US_STATES.map((state) => (
                    <div key={state} className="flex items-center space-x-2">
                      <Checkbox
                        id={`state-${state}`}
                        checked={formData.operating_states.includes(state)}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("operating_states", state, checked as boolean)
                        }
                      />
                      <Label htmlFor={`state-${state}`} className="text-sm font-normal cursor-pointer">
                        {state}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button type="button" variant="outline" onClick={() => router.push("/")} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {isLoading ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
