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

// FIXME: 取得 DB 裡的所有使用者 id + nick_name
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

export {
  getAllUsers,
  getAllUserIds,
  getUserInfo1,
  getUserDesireAgeRange,
  getMatchTag1,
};
