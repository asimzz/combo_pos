'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignInPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const result = await signIn('credentials', {
        phone,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid credentials')
      } else {
        toast.success('Signed in successfully!')
        router.push('/sell')
      }
    } catch (error) {
      toast.error('An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-xl border border-card-border shadow-sm p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Combo Restaurant"
              className="h-16 w-auto"
            />
          </div>
          <p className="text-2xl font-bold text-primary-600 mb-2">POS System</p>
          <p className="text-sm text-muted">Sign in to your account</p>
          <p className="text-xs text-secondary-600 font-semibold tracking-wider mt-3">DIFFERENT EVERY TIME. ALWAYS YOU.</p>
        </div>

        {/* Demo Credentials */}
        <div className="mb-6 rounded-lg border border-dashed border-card-border bg-surface p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Demo credentials</h3>
          <div className="space-y-1 font-mono text-xs text-gray-700">
            <p><span className="text-muted">Admin:</span> 0780000001 / admin123</p>
            <p><span className="text-muted">Staff:</span> 0780000002 / staff123</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" loading={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        {/* Quick Login Buttons */}
        <div className="mt-6">
          <p className="text-xs text-muted text-center mb-3">Quick Login</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPhone('0780000001')
                setPassword('admin123')
              }}
            >
              Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPhone('0780000002')
                setPassword('staff123')
              }}
            >
              Staff
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
