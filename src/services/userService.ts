import axiosInstance from "@/api/axios"
import { UserProfile, UpdateProfileData, UpdateStatusData, DeleteProfileData } from "@/types/user"

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await axiosInstance.get<{ data: UserProfile }>('/users/me')
      return response.data.data
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to fetch profile')
      }
      throw error
    }
  },

  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    try {
      const response = await axiosInstance.put<{ data: UserProfile }>('/users/me', data)
      return response.data.data
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to update profile')
      }
      throw error
    }
  },

  updateStatus: async (data: UpdateStatusData): Promise<UserProfile> => {
    try {
      const response = await axiosInstance.patch<{ data: UserProfile }>('/users/me/status', data)
      return response.data.data
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to update status')
      }
      throw error
    }
  },

  deleteProfile: async (data: DeleteProfileData): Promise<void> => {
    try {
      await axiosInstance.post('/users/me/delete', data)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to delete profile')
      }
      throw error
    }
  },

  getUsers: async (): Promise<UserProfile[]> => {
    try {
      const response = await axiosInstance.get<{ data: UserProfile[] }>('/users')
      return response.data.data
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to fetch users')
      }
      throw error
    }
  }
}