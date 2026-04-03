import axiosInstance from './UrlService.js'

export const loginWithEmail = async (email, password) => {
  try {
    const response = await axiosInstance.post('/auth/email-login', {email, password})
    return response.data
  } catch (error) {
    throw error?.response?.data || {message: error.message}
  }
}

export const updateUserProfile = async (updateData) => {
  try {
    const response = await axiosInstance.post('/update-profile', { updateData })
    return response.data
  } catch (error) {
    throw error?.response?.data || { message: error.message }
  }
}

export const checkAuth = async () => {
  try {
    const { data } = await axiosInstance.get('/auth/check-auth');
    return { isAuthenticated: data.success, user: data.data || null };
  } catch (error) {
    throw error?.response?.data || { message: error.message }
  }
}

export const logOutUser = async () => {
  try {
    const response = await axiosInstance.get('/auth/log-out')
    return response.data
  } catch (error) {
    throw error?.response?.data || {message: error.message}
  }
}

export const getAllUser = async () => {
  try {
    const response = await axiosInstance.get('/users')
    return response.data
  } catch (error) {
    throw error?.response?.data || {message: error.message}
  }
}

