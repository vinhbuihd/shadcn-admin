import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthResponse {
  message: string
  data: AuthUser
}

interface MeResponse {
  data: AuthUser
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

async function register(input: RegisterInput) {
  const response = await apiClient.post<AuthResponse>('/auth/register', input)
  return response.data.data
}

async function login(input: LoginInput) {
  const response = await apiClient.post<AuthResponse>('/auth/login', input)
  return response.data.data
}

async function logout() {
  await apiClient.post('/auth/logout')
}

async function me() {
  const response = await apiClient.get<MeResponse>('/auth/me')
  return response.data.data
}

export const meQueryOptions = () =>
  queryOptions({
    queryKey: ['auth', 'me'],
    queryFn: me,
    retry: false,
  })

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      queryClient.setQueryData(meQueryOptions().queryKey, user)
    },
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(meQueryOptions().queryKey, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: meQueryOptions().queryKey })
    },
  })
}
