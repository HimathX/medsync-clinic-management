import axios, { type AxiosInstance, AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'


// Types for API responses
interface ApiError {
  detail?: string
  message?: string
  status?: number
}


// Environment configuration - Read from .env
const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_TIMEOUT: number = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10)
const ENABLE_LOGS: boolean = import.meta.env.VITE_ENABLE_LOGS === 'true'


// Create axios instance with TypeScript support
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})


// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Use 'auth_token' (matches FastAPI setup)
    const token: string | null = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Log requests in development
    if (ENABLE_LOGS) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${API_BASE_URL}${config.url}`)
    }

    return config
  },
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
)


// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    if (ENABLE_LOGS) {
      console.log(`✅ Response from ${response.config.url}:`, response.data)
    }
    return response
  },
  (error: AxiosError<ApiError>): Promise<AxiosError<ApiError>> => {
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Unauthorized - remove token and redirect to login
          localStorage.removeItem('auth_token')
          localStorage.removeItem('patientId')
          console.error('❌ Unauthorized - Please login')
          window.location.href = '/patient-login'
          break

        case 404:
          console.error('❌ Not found:', data.detail || data.message)
          break

        case 422:
          // Validation error (FastAPI)
          console.error('❌ Validation error:', data.detail || data.message)
          break

        case 500:
          console.error('❌ Server error:', data.detail || data.message)
          break

        default:
          console.error('❌ API Error:', data.detail || data.message)
      }
    } else if (error.request) {
      console.error('❌ No response from server. Please check your connection.')
    } else {
      console.error('❌ Request error:', error.message)
    }

    return Promise.reject(error)
  }
)


/**
 * Helper function to handle API errors (FastAPI compatible)
 * @param error - The axios error object
 * @param defaultMsg - Default error message if none is provided
 * @returns Error message string
 */
export const handleApiError = (error: unknown, defaultMsg: string = 'An error occurred'): string => {
  if (axios.isAxiosError(error)) {
    // FastAPI returns errors in 'detail' field
    const errorMsg =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      defaultMsg

    return typeof errorMsg === 'string' ? errorMsg : defaultMsg
  }

  if (error instanceof Error) {
    return error.message
  }

  return defaultMsg
}


/**
 * Type-safe API request wrapper
 * @param method - HTTP method
 * @param url - API endpoint
 * @param data - Request payload (for POST, PUT, PATCH)
 * @param config - Additional axios config
 * @returns Promise with typed response
 */
export const apiRequest = async <T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
  config?: InternalAxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  try {
    if (method === 'GET' || method === 'DELETE') {
      return await api[method.toLowerCase() as 'get' | 'delete']<T>(url, config)
    } else {
      return await api[method.toLowerCase() as 'post' | 'put' | 'patch']<T>(url, data, config)
    }
  } catch (error) {
    throw error
  }
}


// Convenience methods for common HTTP operations
export const apiClient = {
  get: <T = unknown>(url: string, config?: InternalAxiosRequestConfig) =>
    api.get<T>(url, config),

  post: <T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) =>
    api.post<T>(url, data, config),

  put: <T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) =>
    api.put<T>(url, data, config),

  patch: <T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) =>
    api.patch<T>(url, data, config),

  delete: <T = unknown>(url: string, config?: InternalAxiosRequestConfig) =>
    api.delete<T>(url, config),
}


export default api