// 設定模組
import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

// 快取
import Cache from "../util/cache.js";

// 資料庫的資訊
export const pool = mysql
  .createPool({
    host: process.env.MySQL_HOST,
    user: process.env.MySQL_USER,
    password: process.env.MySQL_PASSWORD,
    database: process.env.MySQL_DATABASE,
  })
  .promise();

// FIXME: 取得 DB 裡的所有使用者 id + nick_name + coordinate
const getAllUsers = async () => {
  const queryStr = `
    SELECT id, nick_name FROM user
    `;

  let [result] = await pool.query(queryStr);

  return result;
};

// FIXME: 取得 DB 裡的所有使用者 id (優化：遍歷 array，效能差)
const getAllUserIds = async () => {
  const queryStr = `
  SELECT id FROM user
  `;

  let [result] = await pool.query(queryStr);
  result = result.map((user) => user.id);

  return result;
};

// FIXME: 取得使用者基本資料 (以 id number 表示)
const getUserInfo1 = async (id) => {
  const queryStr = `
    SELECT id, nick_name,
    birth_year, birth_month, birth_date, 
    sex_id, sexual_orientation_id AS orientation_id
    FROM user
    WHERE id = ?
    `;

  const [[result]] = await pool.query(queryStr, [id]);

  return result;
};

// FIXME: 取得使用者想要的年齡區間 (以 id number 表示)
const getUserDesireAgeRange = async (id) => {
  const queryStr = `
    SELECT id, seek_age_min, seek_age_max
    FROM user
    WHERE id = ?
    `;

  const [[result]] = await pool.query(queryStr, [id]);

  return result;
};

// FIXME: 取得配對資料 (以 tag_id number 表示)
const getMatchTag1 = async (id) => {
  const queryStr = `
    SELECT U.id, UT.tag_id
    FROM user AS U
    INNER JOIN user_tag AS UT
    ON U.id = UT.user_id
    WHERE U.id = ?
    `;

  const [result] = await pool.query(queryStr, [id]);

  return result;
};

// 存入 candidates 到 DB
const saveCandidatesToDB = async (match_pair) => {
  const queryStr = `
  INSERT INTO user_candidate
  (user_id, candidate_id)
  VALUES ?
  `;

  const values = [];

  for (const userId in match_pair) {
    match_pair[userId].forEach((candidateId) => {
      values.push([+userId, candidateId]);
    });
  }

  const [result] = await pool.query(queryStr, [values]);

  return result;
};

// FIXME: candidate 存進 cache (放在 model ??)
const saveCandidatesToCache = async (match_pair) => {
  for (const userId in match_pair) {
    // 要幫每一個候選人加上 nickname
    for (const candidateId of match_pair[userId]) {
      // 取得 candidate 的基本資訊
      const candidateInfo = await getUserInfo1(candidateId);

      try {
        if (Cache.ready) {
          await Cache.hset(
            `candidates_of_userid#${userId}`,
            candidateId,
            candidateInfo.nick_name
          );
        }
      } catch (error) {
        console.error(`cannot save candidates into cache:`, error);
      }
    }
  }
};

// FIXME: 輸出特定使用者的 "candidate" (先 cache 後 DB 取出) (應該放在 model ?)
const getCandidateOfSelf = async (userId) => {
  try {
    if (Cache.ready) {
      const candidateIds = await Cache.hkeys(`candidates_of_userid#${userId}`);
      const candidateNames = await Cache.hvals(
        `candidates_of_userid#${userId}`
      );

      const candidateList = {};

      candidateIds.forEach((id, index) => {
        candidateList[id] = candidateNames[index];
      });
      return candidateList;
    }
  } catch (error) {
    console.error(`cannot get candidates from cache:`, error);
  }
};

// FIXME: 輸出特定使用者的 "who_like_me" (先 cache 後 DB 取出) (應該放在 model ?)
const getSuitorOfSelf = async (userId) => {
  try {
    if (Cache.ready) {
      const suitorIds = await Cache.hkeys(`who_like_me_of_userid#${userId}`);
      const suitorNames = await Cache.hvals(`who_like_me_of_userid#${userId}`);

      const suitorList = {};

      suitorIds.forEach((id, index) => {
        suitorList[id] = suitorNames[index];
      });
      return suitorList;
    }
  } catch (error) {
    // cache 裡沒有這個使用者的 "who_like_me"
    console.error(`cannot get suitors from cache:`, error);
    return {};
  }
};

// FIXME: 取得使用者所有的 "partners" (先 cache 後 DB 取出) (應該放在 model ?)
const getAllPartnerOfUser = async (userId) => {
  try {
    if (Cache.ready) {
      const partnerIds = await Cache.hkeys(`partners_of_userid#${userId}`);
      const chatroomInfo = await Cache.hvals(`partners_of_userid#${userId}`);

      const result = {};

      partnerIds.forEach((partnerId, index) => {
        result[partnerId] = JSON.parse(chatroomInfo[index]);
      });

      return result;
    }
  } catch (error) {
    console.error(`cannot get all partners from cache:`, error);
    return {};
  }
};

// TODO: 從 DB 刪除 candidate

export {
  getAllUsers,
  getAllUserIds,
  getUserInfo1,
  getUserDesireAgeRange,
  getMatchTag1,
  saveCandidatesToDB,
  saveCandidatesToCache,
  getCandidateOfSelf,
  getSuitorOfSelf,
  getAllPartnerOfUser,
};
