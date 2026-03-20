import express from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { deleteMessage, getConversation, getMessages, markAsRead, sendMessagge } from '../controllers/chatController.js'
import { multerMiddleware } from '../config/cloudinaryConfig.js'

export const chatRouter = express.Router()


chatRouter.post('/send-message', authMiddleware, multerMiddleware, sendMessagge)
chatRouter.get("/conversations", authMiddleware, getConversation)
chatRouter.get("/conversations/:conversationId/messages", authMiddleware, getMessages)
chatRouter.put('/messages/read', authMiddleware, markAsRead)
chatRouter.delete('/messages/:messageId/delete', authMiddleware, deleteMessage)
