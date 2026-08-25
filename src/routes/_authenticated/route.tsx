import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { meQueryOptions } from '@/features/auth/api'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.ensureQueryData(meQueryOptions())
      return { user }
    } catch {
      throw new Error('Unauthorized')
    }
  },
  component: AuthenticatedLayout,
})
