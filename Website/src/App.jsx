import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import Welcome from './pages/WelcomeSection/Welcome'
import ChatList from './pages/ChatSection/ChatList.jsx'
import { ToastContainer, toast } from 'react-toastify';
import { ProtectedRoute, PublicRoute } from './protected.js';

const App = () => {
  return (
    <>
    <ToastContainer />
    <Routes>
      <Route path='/' element={<Navigate to="/welcome" />} />
      <Route element={<PublicRoute />}>
      <Route path='/welcome' element={<Welcome />} />
      </Route>
      <Route element={<ProtectedRoute />}>
      <Route path='/chat-list' element={<ChatList />} />
      </Route>
    </Routes>
    </> 
  )
}

export default App
