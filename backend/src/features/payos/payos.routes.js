import { Router } from "express";
import {
  createGymPayment,
  handlePaymentWebhook,
  getPaymentStatus,
  cancelGymPayment,
} from "./payos.controller.js";

const router = Router();

/**
 * @route   POST /api/payos/create-gym-payment
 * @desc    Tạo payment link cho gói tập gym
 * @access  Public
 * @body    {
 *   packageId: string,
 *   packageName: string,
 *   packagePrice: number,
 *   packageDuration: number,
 *   userId: string,
 *   userName: string,
 *   userEmail: string (optional),
 *   userPhone: string (optional),
 *   returnUrl: string (optional),
 *   cancelUrl: string (optional)
 * }
 */
router.post("/create-gym-payment", createGymPayment);

/**
 * @route   POST /api/payos/webhook
 * @desc    Xử lý webhook từ PayOS khi thanh toán thành công
 * @access  PayOS only
 */
router.post("/webhook", handlePaymentWebhook);

/**
 * @route   GET /api/payos/payment/:orderCode
 * @desc    Lấy thông tin trạng thái thanh toán
 * @access  Public
 */
router.get("/payment/:orderCode", getPaymentStatus);

/**
 * @route   POST /api/payos/cancel/:orderCode
 * @desc    Hủy thanh toán
 * @access  Public
 * @body    { reason: string }
 */
router.post("/cancel/:orderCode", cancelGymPayment);

export default router;
