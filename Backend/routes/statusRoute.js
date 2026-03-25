import express from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { multerMiddleware } from '../config/cloudinaryConfig.js'
import {createStatus, getStatus, viewStatus, deleteStatus} from '../controllers/statusController.js'

export const statusRouter = express.Router()

statusRouter.post('/', authMiddleware, multerMiddleware, createStatus)
statusRouter.get('/', authMiddleware, getStatus)
statusRouter.put('/:statusId/view', authMiddleware, viewStatus)
statusRouter.delete('/:statusId/', authMiddleware, deleteStatus)