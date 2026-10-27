
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import Logo from '../components/Logo'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    if (data.session) {
      window.location.href = '/app'
    } else {
      setMessage('Account created! Check your email to confirm your account.')
    }
  }


  async function handleGoogleSignup() {
    setMessage('')
    setGoogleLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      setMessage(error.message)
      setGoogleLoading(false)
    }
  }


  return (
    <main className="signup-page">
      <div className="signup-glow signup-glow-one" />
      <div className="signup-glow signup-glow-two" />

      <div className="signup-brand">
        <Logo />
      </div>

      <section className="signup-layout">
        <div className="signup-intro">
          <div className="eyebrow">
            <span /> YOUR MONEY. YOUR CONTROL.
          </div>

          <h1>
            Make every
            <br />
            rupee <span>count.</span>
          </h1>

          <p className="intro-copy">
            A smarter way to track spending, build better habits,
            and take control of your financial future.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">↗</span>
              <div>
                <strong>Know where it goes</strong>
                <p>See your spending clearly, without the guesswork.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">◈</span>
              <div>
                <strong>Build better habits</strong>
                <p>Make confident decisions with your money.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <div>
                <strong>Your finances, organised</strong>
                <p>Bring your financial life into one simple space.</p>
              </div>
            </div>
          </div>

          <div className="intro-footer">
            A little more clarity. A lot more confidence.
          </div>
        </div>

        <div className="signup-card">
          <div className="card-topline">
            <span>GET STARTED</span>
            <span>01 / 02</span>
          </div>

          <h2>Create your account</h2>
          <p className="card-subtitle">
            Your smarter money journey starts here.
          </p>

          <form onSubmit={handleSignup}>
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              autoComplete="name"
            />

            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Enter password again"
              required
              autoComplete="new-password"
            />

            <button type="submit" disabled={loading || googleLoading}>
              {loading ? 'Creating your account…' : 'Create account  →'}
            </button>
          </form>

          <div className="google-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="google-login-button"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.72 6C44.42 37.87 46.98 31.7 46.98 24.55Z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.72-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
              />
            </svg>
            {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
          </button>

          {message && (
            <p className="signup-message" role="status">
              {message}
            </p>
          )}

          <p className="login-prompt">
            Already have an account? <Link to="/login">Log in</Link>
          </p>

          <p className="terms-note">
            Your financial journey. Your own space.
          </p>
        </div>
      </section>
    </main>
  )
}
