// 導入模組
import express from "express";
const matchRouter = express.Router();

import {
  suggestCandidateToAllUsers,
  suggestCandidateToNewOne,
} from "../controllers/match_controller.js";

// 可使用的 request body 格式
// for content-type: application/json
matchRouter.use(express.json());

// 產生 candidate list
matchRouter.post("/match/allusers", suggestCandidateToAllUsers);
matchRouter.post("/match/newone", suggestCandidateToNewOne);

// 輸出路由
export default matchRouter;
