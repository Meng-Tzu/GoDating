// 導入模組
import express from "express";
const chatRouter = express.Router();

import {
  deleteChatIndex,
  creatChatIndex,
  saveChatRecord,
  loadAllChatRecord,
  searchChatRecord,
} from "../controllers/chat_record_controller.js";

// 可使用的 request body 格式
chatRouter.use(express.json());

// TODO: 刪除聊天記錄的 index

// FIXME: 創建聊天記錄的 index (驗證 JWT)
chatRouter.post("/chat/createindex", creatChatIndex);

// FIXME: 存聊天紀錄到 ES (驗證 JWT)
chatRouter.post("/chat/saverecord", saveChatRecord);

// FIXME: 載入全部聊天紀律 (驗證 JWT)
chatRouter.get("/chat/allrecord", loadAllChatRecord);

// FIXME: 模糊搜尋聊天紀錄 (驗證 JWT)
chatRouter.get("/chat/fuzzysearch", searchChatRecord);

// 輸出路由
export { chatRouter };
