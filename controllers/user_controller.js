import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

// 快取
import Cache from "../util/cache.js";

import {
  getAllUsers,
  getUserBasicInfo,
  getMultiCandidatesDetailInfo,
  getPartnerFromCache,
} from "../models/user_model.js";

import { getAge } from "../util/util.js";

const getUserIdName = async (req, res) => {
  const data = await getAllUsers();
  const response = { data: data };
  res.status(200).json(response);
  return;
};

// FIXME: 輸出特定使用者的 partner API ( cache miss 時改撈 DB)
const certainUserPartnerList = async (req, res) => {
  // FIXME: 改從 authentication 拿 user id
  const { userid } = req.body;
  const partnerList = await getPartnerFromCache(userid);

  const response = { data: [] };

  response.data.push(partnerList);

  res.status(200).json(response);
  return;
};

// FIXME: 把候選人資料從 DB 存進 cache (何時觸發 ?)
const sexType = { 1: "男性", 2: "女性" };

const candidateIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const saveCandidateInfoFromDBtoCache = async (candidateIds) => {
  // 整理從 DB 拿到的候選人詳細資料
  const cadidateList = await getMultiCandidatesDetailInfo(candidateIds);
  cadidateList.forEach((candidate) => {
    const candidateBirthday = `${candidate.birth_year}/${candidate.birth_month}/${candidate.birth_date}`;
    const age = getAge(candidateBirthday);
    const sex = sexType[candidate.sex_id];
    const imageUrl = `${process.env.IP}/${candidate.main_image}`;
    candidate.age = age;
    candidate.sex = sex;
    candidate.main_image = imageUrl;
    delete candidate.sex_id;
    delete candidate.birth_year;
    delete candidate.birth_month;
    delete candidate.birth_date;
  });

  // 把候選人資料存進 cache
  for (const candidate of cadidateList) {
    if (Cache.ready) {
      await Cache.hmset(`candidate_info_id#${candidate.id}`, candidate);
    }
  }
};

// try {
//   await saveCandidateInfoFromDBtoCache(candidateIds);
// } catch (error) {
//   console.error(`cannot save candidate detail info into cache:`, error);
// }

// 登入驗證
const signIn = async (req, res) => {
  const { inputEmail, inputPassword } = req.body;

  const { id, password, nick_name } = await getUserBasicInfo(inputEmail);

  if (!id) {
    // id 為空, 表示 email 不存在
    res.status(403).json({ error: "Sorry, your input is not correct." });
    return;
  }

  // TODO: 使用 argon2 解密碼
  if (inputPassword != password) {
    res.status(403).json({ error: "Sorry, your input is not correct." });
    return;
  }

  const token = jwt.sign({ id, email: inputEmail }, process.env.TOKEN_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRE,
  });

  const response = {
    data: {
      access_token: token,
      access_expired: process.env.TOKEN_EXPIRE,
      user: {
        id,
        name: nick_name,
      },
    },
  };

  res.json(response);
  return;
};

// TODO: 註冊

// JWT token 驗證
const verify = async (req, res) => {
  // 從來自客戶端請求的 header 取得和擷取 JWT
  const token = req.header("Authorization").replace("Bearer ", "");

  if (!token) {
    // 使用者沒有輸入token
    res.status(401).send({ error: "No token provided." });
    return;
  }

  try {
    // 解開 token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    // 拿token去DB撈profile
    const { id, email, nick_name } = await getUserBasicInfo(decoded.email);

    // response JSON
    const response = {
      data: { id, name: nick_name, email },
    };

    res.json(response);
    return;
  } catch (err) {
    res.status(403).send({ error: "Wrong token." });
    return;
  }
};

export { getUserIdName, certainUserPartnerList, signIn, verify };
