
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabase'
import Logo from '../components/Logo'
import { redirectAfterLogin } from '../authRedirect'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    await redirectAfterLogin()
  }

  
async function handleGoogleLogin() {
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
        <motion.div
          className="signup-intro"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1>
            Your money.
            <br />
            Your <span>control.</span>
          </h1>

          <p className="intro-copy">
            Pick up where you left off. Your financial journey
            continues with SpendWise.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">↗</span>
              <div>
                <strong>Stay in control</strong>
                <p>Keep your finances organised in one place.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">◈</span>
              <div>
                <strong>Track your progress</strong>
                <p>Build better money habits every day.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <div>
                <strong>Your account, your space</strong>
                <p>Your personal money dashboard awaits.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="signup-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="card-topline">
            <span>YOUR ACCOUNT</span>
          </div>
          <h2>Welcome back</h2>
          <p className="card-subtitle">
            Log in to continue to your account.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            <button type="submit" disabled={loading || googleLoading}>
              {loading ? 'Logging in…' : 'Log in  →'}
            </button>
          </form>

          <div className="google-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="google-login-button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.72 6C44.42 37.87 46.98 31.7 46.98 24.55Z" />
              <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.72-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
            </svg>
            {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
          </button>

          {message && (
            <p className="signup-message" role="status">
              {message}
            </p>
          )}

          <p className="login-prompt">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </motion.div>
      </section>
    </main>
  )
}
