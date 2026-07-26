import axios, { type AxiosError } from 'axios'
import { env } from '@/config/env'
import { ApiError, type ApiErrorBody } from '@/types/api'

export type TokenGetter = () => string | null
export type UnauthorizedHandler = () => void

let getAccessToken: TokenGetter = () => null
let onUnauthorized: UnauthorizedHandler = () => undefined

export function configureApiClient(options: {
  getAccessToken: TokenGetter
  onUnauthorized: UnauthorizedHandler
}) {
  getAccessToken = options.getAccessToken
  onUnauthorized = options.onUnauthorized
}

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function resolveErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback
  const detail = (body as ApiErrorBody).detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return fallback
}

api.interceptors.response.use(
  (response) => {
    // Return data directly to simulate the previous fetch wrapper behavior
    return response.data
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized()
    }

    const status = error.response?.status ?? 500
    const body = error.response?.data
    const fallbackMessage = error.response?.statusText || error.message || 'Request failed'

    throw new ApiError(status, resolveErrorMessage(body, fallbackMessage), body)
  },
)
