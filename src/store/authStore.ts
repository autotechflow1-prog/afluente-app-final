import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => {
  supabase.auth.getSession().then(({ data }) => {
    set({ user: data.session?.user ?? null, loading: false })
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    set({ user: session?.user ?? null, loading: false })
  })

  return {
    user: null,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
    signOut: async () => {
      await supabase.auth.signOut()
      set({ user: null })
    },
  }
})
