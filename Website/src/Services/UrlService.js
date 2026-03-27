import axios from 'axios'
import dotenv from "dotenv";

dotenv.config()

const apiUrl = `${process.env.REACT_APP_BACKEND_URL}/api/`

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
})

export default axiosInstance
