import express from 'express'
import {authMiddleware} from '../middlewares/authMiddleware.js'
import {updateProfile, logOut, checkAuthenticated, getRecentChats, getAllUserWithContacts, getSavedContacts} from '../controllers/updateProfileController.js'
import upload from '../middlewares/multerMiddleware.js'

export const updateProfileRoute = express.Router()

updateProfileRoute.put('/profile', authMiddleware, upload.single("profilePicture"), updateProfile )


// auth route
updateProfileRoute.get('/log-out', logOut)
updateProfileRoute.get('/check-auth', authMiddleware, checkAuthenticated)
updateProfileRoute.get('/recent-chats', authMiddleware, getRecentChats)
updateProfileRoute.post('/get-mutual-users', authMiddleware, getAllUserWithContacts)
updateProfileRoute.get('/get-saved-contacts', authMiddleware, getSavedContacts)
