import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export function getProfileUsername(user: Pick<User, 'email' | 'user_metadata'>) {
  return (
    user.user_metadata?.username ||
    user.email?.split('@')[0] ||
    'user'
  )
}

export async function ensureProfile(user: User) {
  const username = getProfileUsername(user)

  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, username },
      { onConflict: 'id', ignoreDuplicates: true }
    )

  if (error) throw error
}
