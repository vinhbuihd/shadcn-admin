import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { type Tag } from '@/features/tags/api'
import { apiClient } from '@/lib/api-client'

export interface Bookmark {
  id: string
  url: string
  title: string
  note: string | null
  createdAt: string
  updatedAt: string
  // Optional until GET /bookmarks joins bookmark_tags/tags and returns this.
  tags?: Pick<Tag, 'id' | 'name'>[]
}

interface BookmarkResponse {
  message: string
  data: Bookmark
}

interface BookmarkListResponse {
  data: Bookmark[]
}

export interface BookmarkInput {
  url: string
  title: string
  note?: string | null
}

export type BookmarkUpdateInput = Partial<BookmarkInput>

async function fetchBookmarks() {
  const response = await apiClient.get<BookmarkListResponse>('/bookmarks')
  return response.data.data
}

async function createBookmark(input: BookmarkInput) {
  const response = await apiClient.post<BookmarkResponse>('/bookmarks', input)
  return response.data.data
}

async function updateBookmark({
  id,
  ...input
}: BookmarkUpdateInput & { id: string }) {
  const response = await apiClient.patch<BookmarkResponse>(
    `/bookmarks/${id}`,
    input
  )
  return response.data.data
}

async function deleteBookmark(id: string) {
  await apiClient.delete(`/bookmarks/${id}`)
}

async function attachTag({
  bookmarkId,
  tagId,
}: {
  bookmarkId: string
  tagId: string
}) {
  await apiClient.put(`/bookmarks/${bookmarkId}/tags/${tagId}`)
}

async function detachTag({
  bookmarkId,
  tagId,
}: {
  bookmarkId: string
  tagId: string
}) {
  await apiClient.delete(`/bookmarks/${bookmarkId}/tags/${tagId}`)
}

export const bookmarksQueryOptions = () =>
  queryOptions({
    queryKey: ['bookmarks'],
    queryFn: fetchBookmarks,
  })

export function useCreateBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function useAttachTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: attachTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function useDetachTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: detachTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}
