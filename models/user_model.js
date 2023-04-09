// 設定模組
import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

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

export {
  getAllUsers,
  getAllUserIds,
  getUserInfo1,
  getUserDesireAgeRange,
  getMatchTag1,
};
