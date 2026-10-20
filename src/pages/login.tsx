
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabase'
import Logo from '../components/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

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

    window.location.href = '/app'
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
          <div className="eyebrow">
            <span /> WELCOME BACK
          </div>

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

          <div className="intro-footer">
            A little more clarity. A lot more confidence.
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
            <span>02 / 02</span>
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

            <button type="submit" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in  →'}
            </button>
          </form>

          {message && (
            <p className="signup-message" role="status">
              {message}
            </p>
          )}

          <p className="login-prompt">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>

          <p className="terms-note">
            Your financial journey. Your own space.
          </p>
        </motion.div>
      </section>
    </main>
  )
}
