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

// 存入新註冊者的帳密和暱稱到 DB
const saveUserBasicInfo = async (email, password, nickname) => {
  const queryStr = `
  INSERT INTO user
  (email, password, nick_name)
  VALUES (?, ?, ?)
  `;

  await pool.query(queryStr, [email, password, nickname]);
};

// 存入新註冊者的詳細資料到 DB
const saveUserDetailInfo = async (
  userId,
  birthYear,
  birthMonth,
  birthDate,
  sexId,
  orientationId,
  ageMin,
  ageMax,
  selfIntro,
  pictureName
) => {
  const queryStr = `
  UPDATE user
  SET
  birth_year = ?, 
  birth_month = ?,  
  birth_date = ?, 
  sex_id = ?, 
  sexual_orientation_id = ?, 
  seek_age_min = ?, 
  seek_age_max = ?, 
  self_intro = ?, 
  main_image = ?
  WHERE id = ?
  `;

  await pool.query(queryStr, [
    birthYear,
    birthMonth,
    birthDate,
    sexId,
    orientationId,
    ageMin,
    ageMax,
    selfIntro,
    pictureName,
    userId,
  ]);
};

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

// 取得使用者 id, email, password, nick_name
const getUserBasicInfo = async (email) => {
  const queryStr = `
  SELECT id, email, password, nick_name, main_image
  FROM user
  WHERE email = ?
  `;

  const [[result]] = await pool.query(queryStr, [email]);

  return result;
};

// 取得使用者配對資料
const getUserMatchInfo = async (id) => {
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

// 取得特定使用者的詳細資料
const getUserDetailInfo = async (id) => {
  const queryStr = `
  SELECT id, nick_name, 
  birth_year, birth_month, birth_date,
  sex_id, sexual_orientation_id AS orientation_id, 
  main_image, self_intro
  FROM user
  WHERE id = ?
  `;

  const [[result]] = await pool.query(queryStr, [id]);
  return result;
};

// 取得多個候選人的詳細資料
const getMultiCandidatesDetailInfo = async (candidateIds) => {
  const queryStr = `
  SELECT id, nick_name, 
  birth_year, birth_month, birth_date,
  sex_id, main_image, self_intro
  FROM user
  WHERE id in (?)
  `;

  const [result] = await pool.query(queryStr, [candidateIds]);
  return result;
};

// 取得使用者的性別 (用來確認使用者是否已經填過問卷)
const getUserSexId = async (id) => {
  const queryStr = `
  SELECT id, sex_id 
  FROM user
  WHERE id = ?
  `;

  const [[result]] = await pool.query(queryStr, [id]);

  return result.sex_id;
};

// 取得使用者想要的年齡區間
const getUserDesireAgeRange = async (id) => {
  const queryStr = `
    SELECT id, seek_age_min, seek_age_max
    FROM user
    WHERE id = ?
    `;

  const [[result]] = await pool.query(queryStr, [id]);

  return result;
};

// 存入配對標籤
const saveMatchTagIds = async (userId, tagsIdList) => {
  const queryStr = `
  INSERT INTO user_tag
  (user_id, tag_id)
  VALUES ?
  `;

  const values = [];
  tagsIdList.forEach((tagId) => {
    values.push([+userId, +tagId]);
  });

  const [result] = await pool.query(queryStr, [values]);
  return result;
};

// 取得配對標籤 id
const getMatchTagIds = async (id) => {
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

// 取得配對標籤 title
const getMatchTagTitles = async (userId) => {
  const queryStr = `
    SELECT U.id, UT.tag_id, T.title
    FROM user AS U
    INNER JOIN user_tag AS UT
    ON U.id = UT.user_id
    INNER JOIN tag AS T
    ON UT.tag_id = T.id
    WHERE U.id = ?
    `;

  const [result] = await pool.query(queryStr, [userId]);

  return result;
};

// 存入所有使用者的 candidates 到 DB
const saveCandidatesToDB = async (potentialList) => {
  const queryStr = `
  INSERT INTO user_candidate
  (user_id, candidate_id)
  VALUES ?
  `;

  const values = [];

  for (const userId in potentialList) {
    potentialList[userId].forEach((candidate) => {
      values.push([+userId, candidate.candidateId]);
    });
  }

  const [result] = await pool.query(queryStr, [values]);

  return result;
};

// 將新註冊者與其配對者互相存彼此為 candidates 到 DB
const saveCandidatesOfCertainUser = async (userId, potentialList) => {
  const queryStr = `
  INSERT INTO user_candidate
  (user_id, candidate_id)
  VALUES ?
  `;

  const values = [];
  potentialList.forEach((candidate) => {
    values.push([+userId, candidate.candidateId]);
    values.push([candidate.candidateId, +userId]);
  });

  const [result] = await pool.query(queryStr, [values]);

  return result;
};

// 從 DB 讀取特定使用者的 candidates
const getCandidatesFromDB = async (userId) => {
  const queryStr = `
  SELECT UC.candidate_id, U.nick_name
  FROM user_candidate AS UC
  INNER JOIN user AS U
  ON UC.candidate_id = U.id
  WHERE
  UC.user_id = ?
  `;

  const [result] = await pool.query(queryStr, [userId]);

  const candidateList = {};
  result.forEach((candidate) => {
    candidateList[candidate.candidate_id] = candidate.nick_name;
  });

  return candidateList;
};

// FIXME: 刪除 "user_candidate" 裡所有資料 (無法使用 prepared statement，使用白名單)
const allowedTables = ["user_candidate", "user_pursuer"];

const deleteAllRowInTable = async (tableName) => {
  if (!allowedTables.includes(tableName)) {
    throw new Error(`Table name '${tableName}' is not allowed to delete.`);
  }

  const queryStr = `TRUNCATE TABLE ${tableName}`;

  await pool.query(queryStr);
};

// FIXME: 存入所有使用者的 "pursuer" 到 DB (遍歷效能差)
const savePursuersToDB = async (userPursuerPairs) => {
  const queryStr = `
  INSERT INTO user_pursuer
  (user_id, pursuer_id)
  VALUES ?
  `;
  const userPursuerPair = [];

  for (const userId in userPursuerPairs) {
    let pursuerList = userPursuerPairs[userId];
    pursuerList.forEach((pursuerId) => {
      userPursuerPair.push([+userId, +pursuerId]);
    });
  }

  await pool.query(queryStr, [userPursuerPair]);
};

// 從 DB 讀取特定使用者的 pursuers
const getPursuersFromDB = async (userId) => {
  const queryStr = `
  SELECT UPU.pursuer_id, U.nick_name
  FROM user_pursuer AS UPU
  INNER JOIN user AS U
  ON UPU.pursuer_id = U.id
  WHERE
  UPU.user_id = ?
  `;
  const [result] = await pool.query(queryStr, [userId]);

  const pursuerList = {};
  result.forEach((pursuer) => {
    pursuerList[pursuer.pursuer_id] = pursuer.nick_name;
  });

  return pursuerList;
};

// 更新使用者的經緯度
const updateUserLocationFromDB = async (userId, location) => {
  const queryStr = `
  UPDATE user SET location = ? WHERE id = ?
  `;

  await pool.query(queryStr, [location, userId]);
};

// 取得使用者所有 candidate 的經緯度
const getMultiUserLocationFromDB = async (candidateIds) => {
  const queryStr = `
  SELECT id, nick_name AS name, main_image AS image, location 
  FROM user
  WHERE id in (?)
  `;

  const [result] = await pool.query(queryStr, [candidateIds]);
  return result;
};

// FIXME: 把所有使用者的 candidate 存進 cache (放在 model ??)
const saveCandidatesToCache = async (potentialList) => {
  for (const userId in potentialList) {
    const candidateWithJaccardIndex = potentialList[userId].flatMap(
      ({ jaccardIndex, candidateId }) => [jaccardIndex, candidateId]
    );

    try {
      if (Cache.ready) {
        await Cache.zadd(
          `candidates_of_userid#${userId}`,
          candidateWithJaccardIndex
        );
      }
    } catch (error) {
      console.error(`cannot save candidates into cache:`, error);
    }
  }
};

// FIXME: 將新註冊者與其配對者互相存彼此為 candidates 到 cache (放在 model ??)
const saveCandidatesOfCertainUserToCache = async (userId, potentialList) => {
  for (const candidate of potentialList) {
    try {
      if (Cache.ready) {
        await Cache.zadd(
          `candidates_of_userid#${userId}`,
          candidate.jaccardIndex,
          candidate.candidateId
        );

        await Cache.zadd(
          `candidates_of_userid#${candidate.candidateId}`,
          candidate.jaccardIndex,
          userId
        );
      }
    } catch (error) {
      console.error(`cannot save candidates into cache:`, error);
    }
  }
};

// FIXME: 從 cache 取出特定使用者的 "candidate" (放在 model ?)
const getAllCandidateFromCache = async (userId) => {
  if (Cache.ready) {
    const sortedCandidateIds = await Cache.zrevrange(
      `candidates_of_userid#${userId}`,
      0,
      -1
    );
    return sortedCandidateIds;
  }
};

// FIXME: 從 cache 取出特定使用者的 "pursuer" (應該放在 model ?)
const getPursuerFromCache = async (userId) => {
  try {
    if (Cache.ready) {
      const pursuerIds = await Cache.hkeys(`who_like_me_of_userid#${userId}`);

      const pursuerList = {};

      pursuerIds.forEach((id) => (pursuerList[id] = null));
      return pursuerList;
    }
  } catch (error) {
    // cache 裡沒有這個使用者的 "who_like_me"
    console.error(`cannot get pursuers from cache:`, error);
    return {};
  }
};

// FIXME: 從 cache 取得特定使用者的 "partners" (先 cache 後 DB 取出) (應該放在 model ?)
const getPartnerFromCache = async (userId) => {
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

// FIXME: 從 cache 取出所有使用者的 "pursuer" (應該放在 model ?)
const getPursuersOfAllUsersFromCache = async (allUserIds) => {
  const userPursuerPairs = {};
  if (Cache.ready) {
    for (const userId of allUserIds) {
      const candidateIds = await Cache.hkeys(`who_like_me_of_userid#${userId}`);
      userPursuerPairs[userId] = candidateIds;
    }
  }

  return userPursuerPairs;
};

// FIXME: 從 cache 取得特定候選人的詳細資料 (應該放在 model ?)
const getCandidateInfoFromCache = async (candidateId) => {
  const InfoType = await Cache.hkeys(`candidate_info_id#${candidateId}`);
  const InfoValue = await Cache.hvals(`candidate_info_id#${candidateId}`);

  const candidateInfo = {};
  InfoType.forEach((type, index) => {
    candidateInfo[type] = InfoValue[index];
  });

  return candidateInfo;
};

export {
  saveUserBasicInfo,
  saveUserDetailInfo,
  getAllUsers,
  getAllUserIds,
  getUserBasicInfo,
  getUserMatchInfo,
  getUserDetailInfo,
  getMultiCandidatesDetailInfo,
  getUserSexId,
  getUserDesireAgeRange,
  saveMatchTagIds,
  getMatchTagIds,
  getMatchTagTitles,
  saveCandidatesToDB,
  saveCandidatesOfCertainUser,
  getCandidatesFromDB,
  deleteAllRowInTable,
  savePursuersToDB,
  getPursuersFromDB,
  updateUserLocationFromDB,
  getMultiUserLocationFromDB,
  saveCandidatesToCache,
  saveCandidatesOfCertainUserToCache,
  getAllCandidateFromCache,
  getPursuerFromCache,
  getPartnerFromCache,
  getPursuersOfAllUsersFromCache,
  getCandidateInfoFromCache,
};
