import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiEyeOff, FiEye, FiUser, FiBriefcase } from 'react-icons/fi'
import { authAPI } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [twoFactorMethod, setTwoFactorMethod] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [requiresResetAuthenticator, setRequiresResetAuthenticator] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const role = localStorage.getItem('userRole')

    if (token && role) {
      navigate(role === 'admin' ? '/admin/dashboard' : '/client-dashboard')
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isCreatingAccount && password !== confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }

      const data = isCreatingAccount
        ? await authAPI.register({ name, company, email, password, role: 'client' })
        : await authAPI.login({ email, password })

      if (data.requiresTwoFactor) {
        setTwoFactorToken(data.tempToken)
        setTwoFactorMethod(data.method || 'email')
        setError('')
        return
      }

      localStorage.setItem('authToken', data.token)
      localStorage.setItem('userId', String(data.user.id))
      localStorage.setItem('userRole', data.user.role)
      localStorage.setItem('userEmail', data.user.email)

      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/client-dashboard')
    } catch (err: any) {
      setError(err.error || 'Unable to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await authAPI.forgotPassword({ email })
      setResetToken(data.tempToken || '')
      setRequiresResetAuthenticator(Boolean(data.requiresAuthenticator))
      setError('')
    } catch (err: any) {
      setError(err.error || 'Unable to start password reset')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }

      await authAPI.resetPassword({
        tempToken: resetToken,
        resetCode,
        twoFactorCode,
        newPassword: password
      })

      setIsResettingPassword(false)
      setResetToken('')
      setResetCode('')
      setTwoFactorCode('')
      setPassword('')
      setConfirmPassword('')
      setError('')
    } catch (err: any) {
      setError(err.error || 'Unable to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await authAPI.verifyTwoFactor({ tempToken: twoFactorToken, code: twoFactorCode })
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('userId', String(data.user.id))
      localStorage.setItem('userRole', data.user.role)
      localStorage.setItem('userEmail', data.user.email)
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/client-dashboard')
    } catch (err: any) {
      setError(err.error || 'Unable to verify code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            {isResettingPassword ? 'Reset Password' : isCreatingAccount ? 'Create Account' : 'Client Portal'}
          </h1>
          <p className="text-gray-600">
            {isCreatingAccount ? 'Start your client portal access' : 'Sign in to access your project dashboard'}
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <form onSubmit={isResettingPassword ? resetToken ? handleResetPassword : handleForgotPassword : twoFactorToken ? handleTwoFactorSubmit : handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {twoFactorToken && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                {twoFactorMethod === 'app'
                  ? 'Enter the code from your authenticator app.'
                  : 'A verification code was sent to your email.'}
              </div>
            )}

            {isResettingPassword ? (
              <>
                {!resetToken ? (
                  <div>
                    <label htmlFor="resetEmail" className="block text-gray-700 font-semibold mb-2">Email Address</label>
                    <input
                      type="email"
                      id="resetEmail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="hello@example.com"
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                      Enter the reset code from your email{requiresResetAuthenticator ? ' and your authenticator app code.' : '.'}
                    </div>
                    <input value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="Email reset code" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    {requiresResetAuthenticator && (
                      <input value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="Authenticator app code" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    )}
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                  </>
                )}
              </>
            ) : twoFactorToken ? (
              <div>
                <label htmlFor="twoFactorCode" className="block text-gray-700 font-semibold mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="123456"
                  required
                />
              </div>
            ) : isCreatingAccount && (
              <>
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Jane Client"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-gray-700 font-semibold mb-2">
                    Company
                  </label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Your Company"
                    />
                  </div>
                </div>
              </>
            )}

            {!twoFactorToken && !isResettingPassword && (
              <>
            <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="hello@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-gray-700 font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {isCreatingAccount && (
              <div>
                <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            )}
              </>
            )}

            {/* Remember Me & Forgot Password */}
            {!isCreatingAccount && !twoFactorToken && !isResettingPassword && (
              <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <button type="button" onClick={() => setIsResettingPassword(true)} className="text-blue-600 hover:text-blue-800">
                Forgot password?
              </button>
            </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? isResettingPassword ? 'Working...' : twoFactorToken ? 'Verifying...' : isCreatingAccount ? 'Creating account...' : 'Signing in...'
                : isResettingPassword ? resetToken ? 'Reset Password' : 'Send Reset Code' : twoFactorToken ? 'Verify Code' : isCreatingAccount ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Login Help */}
          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-600 text-center">
              {isCreatingAccount
                ? 'Client accounts are created immediately. Admin accounts should be created through the backend.'
                : 'Use your client or admin account email and password.'}
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8 text-gray-600">
          <p>
            {isResettingPassword ? 'Remembered your password?' : isCreatingAccount ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                if (isResettingPassword) {
                  setIsResettingPassword(false)
                  setIsCreatingAccount(false)
                } else {
                  setIsCreatingAccount(!isCreatingAccount)
                }
                setResetToken('')
                setResetCode('')
                setTwoFactorCode('')
                setError('')
              }}
              className="text-blue-600 font-semibold hover:text-blue-800"
            >
              {isResettingPassword ? 'Sign in' : isCreatingAccount ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
