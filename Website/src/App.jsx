import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import Welcome from './pages/WelcomeSection/Welcome'

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<Navigate to="/welcome" />} />
      <Route path='/welcome' element={<Welcome />} />
    </Routes>
  )
}

export default App
