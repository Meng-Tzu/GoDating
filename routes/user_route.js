// 導入模組
import express from "express";
const userRouter = express.Router();

import { getUserIdName } from "../controllers/user_controller.js";
import { userMatchList } from "../controllers/match_controller.js";

// TODO: 所有使用者名單(需要增加權限管理)
userRouter.get("/user/userslist", getUserIdName);

// TODO: 所有使用者的候選人名單(需要增加權限管理)
userRouter.get("/user/matchcandidate", userMatchList);

// 輸出路由
export { userRouter };
