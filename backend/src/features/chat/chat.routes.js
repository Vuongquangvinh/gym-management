import express from "express";
import { sendChatNotification } from "./chat.controller.js";

const router = express.Router();

/**
 * POST /api/chat/notification
 * Gửi notification khi có tin nhắn chat mới
 *
 * Body:
 * {
 *   chatId: string,
 *   senderId: string,
 *   receiverId: string,
 *   messageText: string,
 *   imageUrl?: string
 * }
 */
router.post("/notification", sendChatNotification);

export default router;
