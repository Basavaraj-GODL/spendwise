import { useState } from 'react'
import { supabase } from '../supabase'
import Logo from '../components/Logo'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <main className="signup-page">
      <div className="signup-glow signup-glow-one" />
      <div className="signup-glow signup-glow-two" />

      <div className="signup-brand">
  <Logo />
</div>

      <section className="signup-layout">
        <div className="signup-intro">
          <div className="eyebrow"><span /> YOUR MONEY. YOUR CONTROL.</div>
          <h1>Make every<br />rupee <span>count.</span></h1>
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

          <div className="intro-footer">A little more clarity. A lot more confidence.</div>
        </div>

        <div className="signup-card">
          <div className="card-topline"><span>GET STARTED</span><span>01 / 02</span></div>
          <h2>Create your account</h2>
          <p className="card-subtitle">Your smarter money journey starts here.</p>

          <form onSubmit={handleSignup}>
            <label htmlFor="name">Full name</label>
            <input id="name" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your full name" required autoComplete="name" />

            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email" />

            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters" required minLength={8}
              autoComplete="new-password" />

            <label htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" type="password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Enter password again" required autoComplete="new-password" />

            <button type="submit" disabled={loading}>
              {loading ? 'Creating your account…' : 'Create account  →'}
            </button>
          </form>

          {message && <p className="signup-message" role="status">{message}</p>}

          <p className="login-prompt">
            Already have an account? <a href="/login">Log in</a>
          </p>
          <p className="terms-note">Your financial journey. Your own space.</p>
        </div>
      </section>
    </main>
  )
}