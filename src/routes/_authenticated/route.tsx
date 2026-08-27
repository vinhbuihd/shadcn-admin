import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { meQueryOptions } from '@/features/auth/api'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    try {
      const user = await context.queryClient.ensureQueryData(meQueryOptions())
      useAuthStore.getState().auth.setUser(user)
      return { user }
    } catch {
      // Any failure to resolve the current user (401, 404, 5xx, API down)
      // means we cannot render an authenticated screen — send the user to
      // sign-in instead of the generic error boundary.
      useAuthStore.getState().auth.reset()
      context.queryClient.removeQueries({
        queryKey: meQueryOptions().queryKey,
      })
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    }
  },
  component: AuthenticatedLayout,
})
