import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface Tag {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface TagResponse {
  message: string
  data: Tag
}

interface TagListResponse {
  data: Tag[]
}

export interface TagInput {
  name: string
}

async function fetchTags() {
  const response = await apiClient.get<TagListResponse>('/tags')
  return response.data.data
}

async function createTag(input: TagInput) {
  const response = await apiClient.post<TagResponse>('/tags', input)
  return response.data.data
}

async function updateTag({ id, ...input }: TagInput & { id: string }) {
  const response = await apiClient.patch<TagResponse>(`/tags/${id}`, input)
  return response.data.data
}

async function deleteTag(id: string) {
  await apiClient.delete(`/tags/${id}`)
}

export const tagsQueryOptions = () =>
  queryOptions({
    queryKey: ['tags'],
    queryFn: fetchTags,
  })

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}
