import { SignInFormValues, SignUpFormValues, AuthResponse } from "../lib/schemas/auth"
import axiosInstance from "@/api/axios"


export const authService = {
  login: async (credentials: SignInFormValues): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post<{ data: AuthResponse }>("/auth/login", credentials)
      return response.data.data
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Login failed')
      }
      throw error
    }
  },

  signup: async (data: SignUpFormValues): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post<{ data: AuthResponse }>("/auth/signup", {
        ...data,
        confirmPassword: undefined, // Remove confirmPassword before sending
      })
      return response.data.data
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Signup failed')
      }
      throw error
    }
  },

  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post("/auth/logout")
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Logout failed')
      }
      throw error
    }
  },

  refresh: async (): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post<{ data: AuthResponse }>("/auth/refresh")
      return response.data.data
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Refresh failed')
      }
      throw error
    }
  }
}

export default axiosInstance 