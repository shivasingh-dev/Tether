import express from "express";
import { blockUser, unblockUser, getBlockedUsers, checkBlockStatus } from "../controllers/blockController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { get } from "mongoose";


export const blockRouter = express.Router()

blockRouter.post('/block', authMiddleware, blockUser)
blockRouter.post('/unblock', authMiddleware, unblockUser)
blockRouter.get('/blocked-users', authMiddleware, getBlockedUsers)
blockRouter.get('/block-status/:otherUserId', authMiddleware, checkBlockStatus)