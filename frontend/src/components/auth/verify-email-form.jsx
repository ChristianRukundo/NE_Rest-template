"use client"

import React, { useState, useEffect } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { useMutation } from "react-query"
import { z } from "zod"
import { toast } from "react-hot-toast"
import { ArrowLeft } from "lucide-react"
import { verifyEmail } from "../../api/auth"

const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email"),
  code: z.string().min(4, "Verification code is required"),
})

export const VerifyEmailForm = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const inputRefs = Array(6)
    .fill(0)
    .map(() => React.createRef())

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email)
    } else {
      navigate("/login")
    }
  }, [location, navigate])

  const verifyMutation = useMutation(verifyEmail, {
    onSuccess: () => {
      toast.success("Email verified successfully!")
      navigate("/login")
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Verification failed. Please try again.")
    },
  })

  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      value = value.charAt(0)
    }

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const verificationCode = code.join("")

    try {
      verifyEmailSchema.parse({ email, code: verificationCode })
      setError("")
      verifyMutation.mutate({ email, code: verificationCode })
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
          <h1 className="text-2xl font-bold mb-2">Enter OTP</h1>
          <p className="text-gray-500">
            We have sent a code to your registered email address
            <br />
            {email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex justify-center space-x-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={1}
                />
              ))}
            </div>
            {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={verifyMutation.isLoading || code.some((digit) => !digit)}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {verifyMutation.isLoading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  )
}
