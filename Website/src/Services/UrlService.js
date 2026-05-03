import axios from 'axios'
import useUserStore from '../Store/useUserStore';
import { getSocket } from './ChatServices';

const apiUrl = `https://tether-backend-five.vercel.app/`


const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
})

axiosInstance.interceptors.request.use((config) => {
  const user = useUserStore.getState().user;
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

