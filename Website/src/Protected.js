import { useState, useEffect } from "react";
import { useLocation, Navigate, replace, Outlet } from 'react-router-dom'
import  useUserStore  from './Store/useUserStore.js';
import { checkAuth } from './Services/UserService.js'
import Loader from './Utils/loader.js'



export const ProtectedRoute = () => {
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(!isAuthenticated)

  const { isAuthenticated, setUser, clearUser } = useUserStore()

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const result = await checkAuth()
        if (result?.isAuthenticated) {
          setUser(result.user)
        } else {
          clearUser()
        }
      } catch (error) {
        console.error(error)
        clearUser()
      } finally {
        setIsChecking(false)
      }
    }
    verifyAuth()
  }, [setUser, clearUser])

  if (isChecking) return <Loader />
  
  return isAuthenticated 
    ? <Outlet /> 
    : <Navigate to='/welcome' state={{ from: location }} replace />;
}


export const PublicRoute = () => {
  const isAuthenticated = useUserStore(state => state.isAuthenticated)
  if (isAuthenticated) {
    return <Navigate to='/chat-list' replace />
  }

  return <Outlet />
} 