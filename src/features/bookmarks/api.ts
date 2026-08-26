import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { type Tag } from '@/features/tags/api'

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

export interface BookmarkListMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface BookmarkListResponse {
  data: Bookmark[]
  meta: BookmarkListMeta
}

export interface BookmarkInput {
  url: string
  title: string
  note?: string | null
}

export type BookmarkUpdateInput = Partial<BookmarkInput>

export interface BookmarkListParams {
  search?: string
  tagId?: string
  page?: number
  pageSize?: number
}

async function fetchBookmarks(params: BookmarkListParams) {
  const response = await apiClient.get<BookmarkListResponse>('/bookmarks', {
    params,
  })
  return response.data
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

export const bookmarksQueryOptions = (params: BookmarkListParams = {}) =>
  queryOptions({
    queryKey: ['bookmarks', params],
    queryFn: () => fetchBookmarks(params),
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
