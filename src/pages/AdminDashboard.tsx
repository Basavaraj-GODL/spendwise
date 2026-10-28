
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

type RegisteredUser = {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<RegisteredUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadUsers() {
      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession()

        if (sessionError) throw sessionError

        const session = sessionData.session
        if (!session) throw new Error('Please sign in first.')

        const { data, error: functionError } =
          await supabase.functions.invoke('admin-users', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          })

        if (functionError) throw functionError
        if (data?.error) throw new Error(data.error)

        if (active) setUsers(data.users ?? [])
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load users.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUsers()
    return () => { active = false }
  }, [])

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-mute">
          Registered accounts and sign-in activity
        </p>
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-sm text-mute">Registered users loaded</p>
        <p className="mt-2 text-3xl font-bold text-ink">
          {loading ? '...' : users.length}
        </p>
      </div>

      <div className="glass min-w-0 overflow-hidden rounded-2xl p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink">
          Registered Users
        </h2>

        {loading && <p className="text-sm text-mute">Loading users...</p>}

        {!loading && error && (
          <p className="break-words text-sm text-red-400">
            {error}
          </p>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="text-sm text-mute">No registered users found.</p>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-line/10 text-mute">
                <tr>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Registered</th>
                  <th className="p-3 font-medium">Last sign-in</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-line/10">
                    <td className="break-all p-3 text-ink">
                      {user.email ?? 'No email'}
                    </td>
                    <td className="whitespace-nowrap p-3 text-mute">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap p-3 text-mute">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
