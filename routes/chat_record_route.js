// 導入模組
import express from "express";
const chatRouter = express.Router();

import { saveChatRecord } from "../controllers/chat_record_controller.js";

// 可使用的 request body 格式
chatRouter.use(express.json());

// FIXME: 存聊天紀錄到 ES (驗證 JWT)
chatRouter.post("/chat/chatrecord", saveChatRecord);

// 輸出路由
export { chatRouter };
