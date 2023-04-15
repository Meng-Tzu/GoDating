// 導入模組
import express from "express";
const userRouter = express.Router();

import { getUserIdName } from "../controllers/user_controller.js";
import {
  AllUserMatchList,
  certainUserMatchList,
} from "../controllers/match_controller.js";

// 可使用的 request body 格式
userRouter.use(express.json());

// FIXME: 所有使用者名單(需要增加權限管理)
userRouter.get("/user/userslist", getUserIdName);

// FIXME: 所有使用者的候選人名單(需要增加權限管理)
userRouter.get("/user/matchcandidate", AllUserMatchList);

// FIXME: 特定使用者的候選人名單 (需要增加權限管理???)
userRouter.post("/user/candidate", certainUserMatchList);

// 輸出路由
export { userRouter };
