import express from 'express'
import {authMiddleware} from '../middlewares/authMiddleware.js'
import {updateProfile, logOut, checkAuthenticated, getAllUser} from '../controllers/updateProfileController.js'

export const updateProfileRoute = express.Router()

updateProfileRoute.put('/update-profile', authMiddleware, updateProfile )


// auth route
updateProfileRoute.get('/log-out', logOut)
updateProfileRoute.get('/check-auth', authMiddleware, checkAuthenticated)
updateProfileRoute.get('/users', authMiddleware, getAllUser)