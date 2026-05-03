import { useState, useEffect } from "react";
import { useLocation, Navigate, Outlet } from 'react-router-dom'
import useUserStore from './Store/useUserStore.js';
import { checkAuth } from './Services/UserService.js'
import Loader from './Utils/loader.jsx'

export const ProtectedRoute = () => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const setUser = useUserStore((state) => state.setUser)
  const clearUser = useUserStore((state) => state.clearUser)

  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)

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
        clearUser()
      } finally {
        setIsChecking(false)
      }
    }

    // Always verify auth on load to get the latest user data (like contact mappings)
    verifyAuth()
  }, [])

  if (isChecking) return <Loader />

  return isAuthenticated
    ? <Outlet />
    : <Navigate to='/welcome' state={{ from: location }} replace />
}


export const PublicRoute = () => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to='/' replace />
  }

  return <Outlet />
}