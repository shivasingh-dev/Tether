import axios from 'axios'
import useUserStore from '../Store/useUserStore';
import { getSocket } from './ChatServices';

// Production url
// const apiUrl = `https://tether-backend-five.vercel.app/`

const apiUrl = `http://localhost:8000/` // Development url


const getToken = () => {
  return localStorage.getItem("auth_token");
}



const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
})

axiosInstance.interceptors.request.use((config) => {
  const user = useUserStore.getState().user || getToken();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  
  const socket = getSocket();
  if (socket && socket.id) {
    config.headers['x-socket-id'] = socket.id;
  }
  
  return config;
});

export default axiosInstance

