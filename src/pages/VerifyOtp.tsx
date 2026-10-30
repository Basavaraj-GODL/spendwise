import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Logo from '../components/Logo'
import {
  verifyOtp,
  sendOtp,
  getPendingSignup,
  clearPendingSignup,
} from '../lib/otp'

export default function VerifyOtp() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const otpVerified = useRef(false)

  const pending = getPendingSignup()

  // No signup in progress -> go back to signup
  useEffect(() => {
    if (!getPendingSignup()) navigate('/signup', { replace: true })
  }, [navigate])

  const maskedPhone = pending ? pending.phone.replace(/\d(?=\d{2})/g, '•') : ''

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')

    const details = getPendingSignup()
    if (!details) {
      navigate('/signup', { replace: true })
      return
    }

    // Check the OTP only once; if account creation fails, retrying doesn't need a new SMS
    if (!otpVerified.current) {
      const result = verifyOtp(code.trim())
      if (!result.ok) {
        setMessage(result.error ?? 'Incorrect OTP.')
        return
      }
      otpVerified.current = true
    }

    // OTP is correct -> create the account (no email is sent)
    setLoading(true)

    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      'create-user',
      {
        body: {
          email: details.email,
          password: details.password,
          name: details.name,
          phone: details.phone,
        },
      }
    )

    if (fnError || fnData?.error) {
      setLoading(false)
      setMessage(fnData?.error || fnError?.message || 'Could not create account.')
      return
    }

    // Account exists and is already confirmed, so sign in directly
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: details.email,
      password: details.password,
    })

    setLoading(false)

    if (signInError) {
      setMessage(signInError.message)
      return
    }

    clearPendingSignup()
    navigate('/app') // dashboard
  }

  async function handleResend() {
    const details = getPendingSignup()
    if (!details) {
      navigate('/signup')
      return
    }
    try {
      await sendOtp(details.phone)
      otpVerified.current = false // a new code needs to be checked again
      setCode('')
      setMessage('A new OTP has been sent.')
    } catch (err) {
      console.error('SMS error:', err)
      setMessage(err instanceof Error ? err.message : 'Could not resend OTP.')
    }
  }

  return (
    <main className="signup-page">
      <div className="signup-brand">
        <Logo />
      </div>

      <section className="signup-layout">
        <div className="signup-card">
          <div className="card-topline">
            <span>VERIFY</span>
          </div>

          <h2>Enter the OTP</h2>
          <p className="card-subtitle">
            We sent a 6-digit code to {maskedPhone}.
          </p>

          <form onSubmit={handleVerify}>
            <label htmlFor="otp">6-digit code</label>
            <input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              required
              autoComplete="one-time-code"
            />

            <button type="submit" disabled={loading || code.length !== 6}>
              {loading ? 'Creating your account…' : 'Verify & create account  →'}
            </button>
          </form>

          <p className="login-prompt">
            Didn’t get it?{' '}
            <a href="#" onClick={e => { e.preventDefault(); handleResend() }}>
              Resend OTP
            </a>
          </p>

          {message && <p className="signup-message" role="status">{message}</p>}
        </div>
      </section>
    </main>
  )
}