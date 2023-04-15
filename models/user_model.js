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

// TODO: 取得 DB 裡的所有使用者 id + nick_name + coordinate
const getAllUsers = async () => {
  const queryStr = `
  SELECT UM.id, UM.nick_name, UD.coordinate
  FROM user_main AS UM
  INNER JOIN user_detail AS UD
  ON UD.user_id = UM.id
    `;

  let [result] = await pool.query(queryStr);

  return result;
};

// FIXME: 取得 DB 裡的所有使用者 id (優化：遍歷 array，效能差)
const getAllUserIds = async () => {
  const queryStr = `
  SELECT id FROM user_main
  `;

  let [result] = await pool.query(queryStr);
  result = result.map((user) => user.id);

  return result;
};

// FIXME: 取得使用者基本資料 (以 id number 表示)
const getUserInfo1 = async (id) => {
  const queryStr = `
    SELECT UM.id, UM.nick_name,
    UD.birth_year, UD.birth_month, UD.birth_date, 
    UD.sex_id, UD.sexual_orientation_id AS orientation_id,
    UD.region_id,
    UD.self_intro
    FROM user_main AS UM
    INNER JOIN user_detail AS UD
    ON UD.user_id = UM.id
    WHERE 
    UM.id = ?
    `;

  const [[result]] = await pool.query(queryStr, [id]);

  return result;
};

// FIXME: 取得使用者想要的年齡區間 (以 id number 表示)
const getUserDesireAgeRange = async (id) => {
  const queryStr = `
    SELECT UD.user_id, UD.seek_age_min, UD.seek_age_max
    FROM user_detail AS UD
    WHERE 
    UD.user_id = ?
    `;

  const [[result]] = await pool.query(queryStr, [id]);

  return result;
};

// FIXME: 取得配對資料 (以 tag_id number 表示)
const getMatchTag1 = async (id) => {
  const queryStr = `
    SELECT UD.user_id, UT.tag_id
    FROM user_detail AS UD
    INNER JOIN user_tag AS UT
    ON UD.user_id = UT.user_id
    WHERE 
    UD.user_id = ?
    `;

  const [result] = await pool.query(queryStr, [id]);

  return result;
};

// FIXME: candidate 存進 cache (放在 model ??)
const saveCandidateOfUser = async (match_pair) => {
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

// TODO: candidate 存進 DB

// FIXME: 輸出特定使用者的 candidate (先 cache 後 DB 取出) (應該放在 model ?)
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

// TODO: 從 DB 刪除 candidate

export {
  getAllUsers,
  getAllUserIds,
  getUserInfo1,
  getUserDesireAgeRange,
  getMatchTag1,
  saveCandidateOfUser,
  getCandidateOfSelf,
};
