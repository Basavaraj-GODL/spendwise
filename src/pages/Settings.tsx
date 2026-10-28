
import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { UserRound, ShieldCheck, Mail } from 'lucide-react'
import { supabase } from '../supabase'

export default function Settings() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        setError('Could not load your account. Please sign in again.')
        setLoading(false)
        return
      }

      setEmail(data.user.email ?? '')
      setDisplayName(
        typeof data.user.user_metadata?.display_name === 'string'
          ? data.user.user_metadata.display_name
          : '',
      )
      setLoading(false)
    }

    void loadProfile()
  }, [])

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')
    setError('')
    setSavingProfile(true)

    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    })

    setSavingProfile(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Profile updated successfully!')
  }

  async function updatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')
    setError('')

    if (newPassword.length < 8) {
      setError('Your new password must contain at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setSavingPassword(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    setSavingPassword(false)

    if (error) {
      setError(error.message)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setMessage('Password updated successfully!')
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-mute">
        Loading settings...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Settings</h1>
        <p className="mt-2 text-sm text-mute">
          Manage your profile and keep your account secure.
        </p>
      </div>

      {message && (
        <div role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-500">
          {message}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-500">
          {error}
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-400/10 p-3 text-violet-400">
            <UserRound size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">Profile</h2>
          </div>
        </div>

        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <label className="block text-sm text-mute">
            Email address
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-line/10 bg-base p-3">
              <Mail size={17} className="text-mute" />
              <span className="break-all text-ink">{email || 'No email available'}</span>
            </div>
          </label>

          <label className="block text-sm text-mute">
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
              placeholder="Enter your name"
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            />
          </label>

          <button type="submit" disabled={savingProfile} className="btn btn-primary">
            {savingProfile ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass rounded-2xl p-5 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-400">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">Security</h2>
          </div>
        </div>

        <form onSubmit={updatePassword} className="mt-5 space-y-4">
          <label className="block text-sm text-mute">
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            />
          </label>

          <label className="block text-sm text-mute">
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter the password again"
              required
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            />
          </label>

          <button type="submit" disabled={savingPassword} className="btn btn-primary">
            {savingPassword ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </motion.section>
    </div>
  )
}
