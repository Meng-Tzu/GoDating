// 導入模組
import express from "express";
const chatRouter = express.Router();

import {
  saveChatRecord,
  searchChatRecord,
} from "../controllers/chat_record_controller.js";

// 可使用的 request body 格式
chatRouter.use(express.json());

// FIXME: 存聊天紀錄到 ES (驗證 JWT)
chatRouter.post("/chat/chatrecord", saveChatRecord);

// callback function
chatRouter.get("/chat/fuzzysearch", searchChatRecord);

// 輸出路由
export { chatRouter };
