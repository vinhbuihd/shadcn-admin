import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Bookmarks } from '@/features/bookmarks'

const bookmarksSearchSchema = z.object({
  search: z.string().optional().catch(undefined),
  tagId: z.string().optional().catch(undefined),
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(20),
})

export const Route = createFileRoute('/_authenticated/bookmarks/')({
  validateSearch: bookmarksSearchSchema,
  component: Bookmarks,
})
