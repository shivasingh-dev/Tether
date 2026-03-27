import axiosInstance from './UrlService'


export const sendPhoneOtp = async (phoneNumber, fullName) => {
  try {
    const response = await axiosInstance.post('/auth/get-phone-otp', { phoneNumber, fullName })
    return response.data
  } catch (error) {
    throw error?.response?.data || { message: error.message }
  }
}

export const verifyPhoneOtp = async (phoneNum, phoneCode) => {
  try {
    const response = await axiosInstance.post('/auth/verify-phone-otp', { phoneNum, phoneCode })
    return response.data
  } catch (error) {
    throw error?.response?.data || { message: error.message }
  }
}

export const sendEmailOtp = async (email, password, phoneNum) => {
  try {
    const response = await axiosInstance.post('/auth/register-email', { email, password, phoneNum })
    return response.data
  } catch (error) {
    throw error?.response?.data || { message: error.message }
  }
}

export const verifyEmailOtp = async (email, otp) => {
  try {
    const response = await axiosInstance.post('/auth/verify-email', { email, otp })
    return response.data
  } catch (error) {
    throw error?.response?.data || { message: error.message }
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
  
}