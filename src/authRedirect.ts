
import { supabase } from './supabase'

export async function redirectAfterLogin() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    window.location.assign('/login')
    return
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Unable to check user role:', error.message)
    window.location.assign('/app')
    return
  }

  if (data?.role === 'admin') {
    window.location.assign('/app/admin')
  } else {
    window.location.assign('/app')
  }
}
