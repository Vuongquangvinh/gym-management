import express from "express";
import { notifyPTScheduleChange } from "./contract.controller.js";
const router = express.Router();

// Route gửi thông báo cho PT khi thay đổi gói tập/khung giờ
router.post("/notify-pt-schedule-change", notifyPTScheduleChange);

export default router;
