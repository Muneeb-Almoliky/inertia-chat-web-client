export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
}

export interface UserProfile {
  id: number
  username: string
  name: string
  email: string
  profilePicture: string | null
  status: UserStatus
  lastSeen: string
}

export interface UpdateProfileData {
  name: string
  username: string
  profilePicture?: string
}

export interface UpdateStatusData {
  status: UserStatus
}

export interface DeleteProfileData {
  password: string
}