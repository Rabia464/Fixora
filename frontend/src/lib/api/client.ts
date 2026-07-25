import { env } from '@/config/env'
import { ApiError, type ApiErrorBody } from '@/types/api'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export type TokenGetter = () => string | null
export type UnauthorizedHandler = () => void

let getAccessToken: TokenGetter = () => null
let onUnauthorized: UnauthorizedHandler = () => undefined

/** Wire auth store → API client (called once from app bootstrap). */
export function configureApiClient(options: {
  getAccessToken: TokenGetter
  onUnauthorized: UnauthorizedHandler
}) {
  getAccessToken = options.getAccessToken
  onUnauthorized = options.onUnauthorized
}

function resolveErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback
  const detail = (body as ApiErrorBody).detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return fallback
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: HttpMethod
    body?: unknown
    auth?: boolean
    signal?: AbortSignal
  } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getAccessToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  if (response.status === 401) {
    onUnauthorized()
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    throw new ApiError(
      response.status,
      resolveErrorMessage(payload, response.statusText || 'Request failed'),
      payload,
    )
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, init?: { auth?: boolean; signal?: AbortSignal }) =>
    apiRequest<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: { auth?: boolean; signal?: AbortSignal }) =>
    apiRequest<T>(path, { ...init, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, init?: { auth?: boolean; signal?: AbortSignal }) =>
    apiRequest<T>(path, { ...init, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, init?: { auth?: boolean; signal?: AbortSignal }) =>
    apiRequest<T>(path, { ...init, method: 'PUT', body }),
  delete: <T>(path: string, init?: { auth?: boolean; signal?: AbortSignal }) =>
    apiRequest<T>(path, { ...init, method: 'DELETE' }),
}
