import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { reportUser, unreportUser, checkReportStatus } from "../controllers/reportController.js";

export const reportRouter = express.Router()

reportRouter.post('/report', authMiddleware, reportUser)
reportRouter.post('/unreport', authMiddleware, unreportUser)
reportRouter.get('/report-status/:otherUserId', authMiddleware, checkReportStatus)
