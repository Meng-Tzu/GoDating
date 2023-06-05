// 導入模組
import express from "express";
const userRouter = express.Router();

import signInValidator from "../middlewares/sign_in_validator.js";
import signUpValidator from "../middlewares/sign_up_validator.js";
import {
  imageValidator,
  criteria,
} from "../middlewares/profile_survey_validator.js";

import {
  signIn,
  signUp,
  verify,
  checkSexInfo,
  getUserIdName,
  certainUserPartnerList,
  saveDetailInfo,
  saveTags,
} from "../controllers/user_controller.js";

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
userRouter.post("/user/signin", signInValidator, signIn);

// 註冊 (必須有 middleware 去驗證 input 格式是正確的)
userRouter.post("/user/signup", signUpValidator, signUp);

// 使用者資料驗證
userRouter.post("/user/verify", verify);

// FIXME: 使用者是否已填過問卷 (post 改成 get)
userRouter.post("/user/profile", checkSexInfo);

// FIXME: 使用者上傳問卷資料 (沒有 middleware 去驗證照片格式是正確的)
userRouter.post("/user/survey", pictureUpload, criteria, saveDetailInfo);

// FIXME: 使用者上傳問卷資料 (必須有 middleware 去驗證 input 格式是正確的)
userRouter.post("/user/tags", saveTags);

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
export default userRouter;
