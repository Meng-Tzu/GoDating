import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import * as argon2 from "argon2";

// 快取
import Cache from "../util/cache.js";

import {
  getAllUserIds,
  saveUserBasicInfo,
  saveUserDetailInfo,
  getAllUsers,
  getUserBasicInfo,
  getUserDetailInfo,
  getUserSexId,
  getUserDesireAgeRange,
  getMatchTagTitles,
  saveMatchTagIds,
  getMultiCandidatesDetailInfo,
  updateUserLocationFromDB,
  getPartnerFromCache,
} from "../models/user_model.js";

import { getAge } from "../util/util.js";

const getUserIdName = async (req, res) => {
  const data = await getAllUsers();
  const response = { data: data };
  res.status(200).json(response);
  return;
};

const sexType = { 1: "男性", 2: "女性" };
const allUserIds = await getAllUserIds();

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

const saveCandidateInfoFromDBtoCache = async (candidateIds) => {
  // 整理從 DB 拿到的候選人詳細資料
  const cadidateList = await getMultiCandidatesDetailInfo(candidateIds);
  cadidateList.forEach((candidate) => {
    const candidateBirthday = `${candidate.birth_year}/${candidate.birth_month}/${candidate.birth_date}`;
    const age = getAge(candidateBirthday);
    const sex = sexType[candidate.sex_id];
    const imageUrl = `images/${candidate.main_image}`;
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

  const userBasicInfo = await getUserBasicInfo(inputEmail);

  // userBasicInfo 為空, 表示使用者未註冊過不存在
  if (!userBasicInfo) {
    res.status(403).json({ error: "Sorry, your input is not correct." });
    return;
  }

  const { id, password, nick_name } = userBasicInfo;

  // 使用 argon2 解密碼
  try {
    if (await argon2.verify(password, inputPassword)) {
      const token = jwt.sign(
        { id, email: inputEmail },
        process.env.TOKEN_SECRET,
        {
          expiresIn: process.env.TOKEN_EXPIRE,
        }
      );

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
    } else {
      // password did not match
      res.status(403).json({ error: "Sorry, your input is not correct." });
      return;
    }
  } catch (error) {
    console.error("cannot analyze password, error:", error);
    res.status(500).json({ error: "Something went wrong with server." });
    return;
  }
};

// FIXME: 註冊 (如何檢查暱稱是否重複?)
const signUp = async (req, res) => {
  // 取得使用者輸入的data
  const { inputEmail, inputPassword, inputName } = req.body;

  // check email exist (撈DB)
  const DBuserInfo = await getUserBasicInfo(inputEmail);
  if (DBuserInfo) {
    // 當DBuserInfo 有值, 表示email已存在
    res.status(403).json({ error: "Email Already Exists." });
    return;
  }

  // generate hash password
  const hashPassword = await argon2.hash(inputPassword);

  // 存入新註冊者的帳密和暱稱到 DB
  await saveUserBasicInfo(inputEmail, hashPassword, inputName);

  // 再次取得新註冊者的在 DB 的 id, email, nick_name
  const { id, email, nick_name } = await getUserBasicInfo(inputEmail);

  const token = jwt.sign({ id, email }, process.env.TOKEN_SECRET, {
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
    const { id, email, nick_name, main_image } = await getUserBasicInfo(
      decoded.email
    );

    // response JSON
    const response = {
      data: { id, name: nick_name, email, image: main_image },
    };

    res.json(response);
    return;
  } catch (err) {
    res.status(403).send({ error: "Wrong token." });
    return;
  }
};

// 檢查使用者是否已經填過詳細資訊和配對條件
const checkSexInfo = async (req, res, next) => {
  // 從來自客戶端請求的 header 取得和擷取 JWT
  const token = req.header("Authorization").replace("Bearer ", "");

  try {
    // 解開 token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    // 拿 token 去 DB 撈 sexInfo
    const sexInfo = await getUserSexId(decoded.id);

    if (sexInfo) {
      res.json({ data: "Detail user-info already existed." });
      return;
    } else {
      res.json({ data: "User hasn't filled out the survey." });
      return;
    }
  } catch (error) {
    console.error("cannot get user's sex id");
    next(error);
    return;
  }
};

// 儲存使用者的詳細資料
const saveDetailInfo = async (req, res) => {
  const {
    userId,
    birthday,
    sexId,
    orientationId,
    seekAgeMin,
    seekAgeMax,
    selfIntro,
  } = req.body;

  // 處理生日日期
  const month = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };

  const birthdayAry = birthday.split(" ");

  const birthYear = +birthdayAry[2];
  const birthMonth = month[birthdayAry[0]];
  const birthDate = +birthdayAry[1].slice(0, -1);

  // 取得圖片檔名
  const picture = req.files.picture;

  // 檢查圖片是否有填
  if (!picture) {
    res.status(400).json({ data: "error: Image is required." });
    return;
  } else {
    const pictureName = picture[0].filename;

    try {
      // 存入 DB
      await saveUserDetailInfo(
        +userId,
        birthYear,
        birthMonth,
        birthDate,
        +sexId,
        +orientationId,
        +seekAgeMin,
        +seekAgeMax,
        selfIntro,
        pictureName
      );
      res.json({ data: "成功儲存配對資訊！" });
      return;
    } catch (error) {
      console.error("cannot save user detail info into DB");
      return;
    }
  }
};

// 儲存 tags
const saveTags = async (req, res) => {
  const { userid, tags } = req.body;

  if (!tags) {
    res.json({
      data: "您尚未選擇任何標籤，選擇標籤可以讓我們幫您找到更適合您的人喔！",
    });
    return;
  }

  const tagsAry = tags.split(",");

  try {
    // 存入 DB
    await saveMatchTagIds(userid, tagsAry);
    res.json({ data: "成功儲存配對標籤！" });
    return;
  } catch (error) {
    console.error("cannot save user's tags info into DB", error);
    return;
  }
};

// FIXME: 取得特定使用者的詳細資訊 (要一直解 token?) (從 DB 拿詳細資訊而不是 cache ??)
const getDetailInfo = async (req, res, next) => {
  // 從來自客戶端請求的 header 取得和擷取 JWT
  const token = req.header("Authorization").replace("Bearer ", "");

  let detailInfo;
  try {
    // 解開 token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    detailInfo = await getUserDetailInfo(decoded.id);

    const candidateBirthday = `${detailInfo.birth_year}/${detailInfo.birth_month}/${detailInfo.birth_date}`;
    const imageUrl = `images/${detailInfo.main_image}`;
    detailInfo.birthday = candidateBirthday;
    detailInfo.main_image = imageUrl;
    delete detailInfo.birth_year;
    delete detailInfo.birth_month;
    delete detailInfo.birth_date;

    // FIXME: 取得使用者的 tags (目前從 DB 拿，可以從 cache 拿 ??)
    const tags = await getMatchTagTitles(decoded.id);
    const desireAgeRange = await getUserDesireAgeRange(decoded.id);
    detailInfo.tagList = tags;
    detailInfo.seek_age_min = desireAgeRange.seek_age_min;
    detailInfo.seek_age_max = desireAgeRange.seek_age_max;

    res.json({ data: detailInfo });
    return;
  } catch (error) {
    console.error("cannot get user's detail info");
    next(error);
    return;
  }
};

// FIXME: 更新使用者的經緯度 (要一直解 token?)
const updateUserLocation = async (req, res, next) => {
  // 從來自客戶端請求的 header 取得和擷取 JWT
  const token = req.header("Authorization").replace("Bearer ", "");
  const { location } = req.body;

  try {
    // 解開 token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    await updateUserLocationFromDB(decoded.id, location);

    res.json({ data: `successfully update location of user-id#${decoded.id}` });
    return;
  } catch (error) {
    console.error("cannot update user's location");
    next(error);
    return;
  }
};

export {
  getUserIdName,
  certainUserPartnerList,
  signIn,
  signUp,
  verify,
  checkSexInfo,
  saveDetailInfo,
  saveTags,
  getDetailInfo,
  updateUserLocation,
};
