"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation } from "react-query"
import { z } from "zod"
import { toast } from "react-hot-toast"
import { ArrowLeft } from "lucide-react"
import { resetPassword } from "../../api/auth"

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export const ForgotPasswordForm = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  const resetMutation = useMutation(resetPassword, {
    onSuccess: () => {
      toast.success("Password reset code sent to your email!")
      navigate("/verify-reset", { state: { email } })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send reset code. Please try again.")
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    try {
      forgotPasswordSchema.parse({ email })
      setError("")
      resetMutation.mutate({ email })
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message)
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-full max-w-md m-auto p-8">
        <div className="mb-6">
          <Link to="/login" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} className="mr-2" />
            <span>Back</span>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
          <p className="text-gray-500">
            Enter your registered email address, we'll send you a code to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${error ? "border-red-500" : "border-gray-300"}`}
              placeholder="your.email@example.com"
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={resetMutation.isLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {resetMutation.isLoading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  )
}
