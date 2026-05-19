import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, loading, signOut } = useAuthStore()
  return { user, loading, signOut, isAuthenticated: !!user }
}
