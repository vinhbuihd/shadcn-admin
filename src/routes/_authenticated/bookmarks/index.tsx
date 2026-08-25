import { createFileRoute } from '@tanstack/react-router'
import { Bookmarks } from '@/features/bookmarks'

export const Route = createFileRoute('/_authenticated/bookmarks/')({
  component: Bookmarks,
})
