// 導入模組
import express from "express";
const userRouter = express.Router();

import {
  getUserIdName,
  certainUserPartnerList,
  saveDetailInfo,
} from "../controllers/user_controller.js";
import { signIn, signUp, verify } from "../controllers/user_controller.js";

import {
  AllUserCandidateList,
  certainUserCandidateList,
  certainUserPursuerList,
} from "../controllers/match_controller.js";

import { upload } from "../util/util.js";

const pictureUpload = upload.fields([{ name: "picture", maxCount: 1 }]);

// 可使用的 request body 格式
// for content-type: application/json
userRouter.use(express.json());

// 登入
userRouter.post("/user/signin", signIn);

// FIXME: 註冊 (必須有 middleware 去驗證 input 格式是正確的)
userRouter.post("/user/signup", signUp);

// 使用者資料驗證
userRouter.post("/user/verify", verify);

// 使用者上傳問卷資料 (必須有 middleware 去驗證 input 格式是正確的)
userRouter.post("/user/profile", pictureUpload, saveDetailInfo);

// FIXME: 所有使用者名單(需要增加權限管理)
userRouter.get("/user/userslist", getUserIdName);

// FIXME: 所有使用者的候選人名單(需要增加權限管理)
userRouter.get("/user/matchcandidate", AllUserCandidateList);

// FIXME: 特定使用者的候選人名單 (需要增加權限管理???)
userRouter.post("/user/candidate", certainUserCandidateList);

// FIXME: 特定使用者的候選人名單 (需要增加權限管理)
userRouter.post("/user/pursuer", certainUserPursuerList);

// FIXME:: 特定使用者的候選人名單 (需要增加權限管理)
userRouter.post("/user/partner", certainUserPartnerList);

// 輸出路由
export { userRouter };
