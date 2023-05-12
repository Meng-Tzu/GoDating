// 快取
import Cache from "../util/cache.js";

import {
  getAllUserIds,
  getUserDetailInfo,
  getUserMatchInfo,
  getUserDesireAgeRange,
  getMatchTagIds,
  saveCandidatesToDB,
  saveCandidatesOfCertainUser,
  getCandidatesFromDB,
  deleteAllRowInTable,
  getPursuersFromDB,
  getAllCandidateFromCache,
  getPursuerFromCache,
  saveCandidatesToCache,
  saveCandidatesOfCertainUserToCache,
} from "../models/user_model.js";

import { getAge } from "../util/util.js";

// -------------------------- Function 區塊 -------------------------------

// Function1: 篩選其他人的性別是否符合自己的性傾向
const preSexMatching = async (selfId, allUserIds) => {
  // 排除自己的 id
  let match1_candidate_ids = allUserIds.filter((userId) => userId !== selfId);
  const self = await getUserMatchInfo(selfId);

  if (self.orientation_id === 3 || self.orientation_id === 6) {
    // 雙性戀, 摸索中 -> 全選
  } else if (self.orientation_id === 2) {
    // 同性戀
    const candidates = [];
    for (let userId of match1_candidate_ids) {
      const candidate = await getUserMatchInfo(userId);
      if (candidate.sex_id === self.sex_id) {
        candidates.push(userId);
      }
    }
    match1_candidate_ids = candidates;
  } else if (self.orientation_id === 1) {
    // FIXME: 異性戀 (有沒有更聰明的篩選?)
    let sex = [1, 2];
    // 剔除自己的性別 id
    sex = sex.filter((sexId) => sexId !== self.sex_id);

    const candidates = [];
    for (let userId of match1_candidate_ids) {
      const candidate = await getUserMatchInfo(userId);
      if (candidate.sex_id === sex[0]) {
        candidates.push(userId);
      }
    }
    match1_candidate_ids = candidates;
  }

  return match1_candidate_ids;
};

// Function2: 排序規則
const compareNumbers = (a, b) => {
  return b.tagCount - a.tagCount;
};

// ------------------------- middleware 區塊 ------------------------------

// FIXME: 取得所有使用者 id -> 有必要嗎?
let allUserIds;

// FIXME: 對所有人篩選合適的 candidate 並存進 cache & DB (何時觸發?)
const suggestCandidateToAllUsers = async (req, res) => {
  // ---------------------------- 篩選開始！ --------------------------------
  allUserIds = await getAllUserIds(); // [ 1, 2, 3, 4 ];
  // console.log("allUserIds", allUserIds);

  // Step1: 篩選候選人符合自己設定的性別/性傾向
  const sex_match_pair = {};
  for (let userId of allUserIds) {
    sex_match_pair[userId] = await preSexMatching(userId, allUserIds);
  }
  // console.log("before: sex_match_pair", sex_match_pair);

  // 確認對方的候選人清單有沒有自己
  for (const userId in sex_match_pair) {
    // 取得使用者的候選人名單
    let candidateIdList = sex_match_pair[userId];
    // console.log("candidateIdList", candidateIdList);

    candidateIdList.forEach((candidateId, index) => {
      // 取得候選人本身的口袋名單
      const shortlistOfCandidate = sex_match_pair[candidateId];
      // console.log("shortlistOfCandidate", shortlistOfCandidate);

      // 如果對方的口袋名單沒有自己，就把對方從自己的候選人名單刪除
      if (!shortlistOfCandidate.includes(+userId)) {
        delete candidateIdList[index]; // 此位置會變成 empty items
      }
    });

    // 清掉 array 裡的 empty items
    sex_match_pair[userId] = candidateIdList.filter(
      (candidateId) => candidateId
    );
  }
  // console.log("after: userId_cadidateId", sex_match_pair);

  // 把使用者的候選人名單加上年齡
  for (const userId in sex_match_pair) {
    // 取得使用者的候選人名單
    const candidateList = sex_match_pair[userId];
    for (let i = 0; i < candidateList.length; i++) {
      const candidateId = candidateList[i];

      // 取得每一個候選人的詳細資訊
      const candidateInfo = await getUserMatchInfo(candidateId);

      // 取得候選人的年齡
      const candidateBirthday = `${candidateInfo.birth_year}/${candidateInfo.birth_month}/${candidateInfo.birth_date}`;
      const candidateAge = getAge(candidateBirthday);

      // 創造 key-value pair: {candidateId: candidateAge}
      const candidateIdAgePair = {};
      candidateIdAgePair[candidateId] = candidateAge;

      // 把使用者的候選人名單加上年齡
      candidateList[i] = candidateIdAgePair;
    }
  }

  // console.log("after add age:", sex_match_pair);

  // Step2: 篩選候選人符合自己設定的年齡條件
  for (const userId in sex_match_pair) {
    // 取得使用者希望的年齡區間
    const desireAgeRange = await getUserDesireAgeRange(userId);
    // console.log("desireAgeRange", desireAgeRange);

    // 取得使用者的候選人名單
    const candidateList = sex_match_pair[userId];

    for (let i = 0; i < candidateList.length; i++) {
      // 取得候選人的年齡
      const candidateAge = Object.values(candidateList[i])[0];

      // 如果候選人不在使用者希望的年齡區間，刪除候選人
      if (
        candidateAge < desireAgeRange.seek_age_min ||
        candidateAge > desireAgeRange.seek_age_max
      ) {
        delete candidateList[i];
      }
    }

    // 清掉 array 裡的 empty items
    sex_match_pair[userId] = candidateList.filter((candidate) => candidate);
  }

  // console.log("after 篩掉不在設定年齡裡的人:", sex_match_pair);

  // 確認對方的候選人清單有沒有自己
  for (const userId in sex_match_pair) {
    // 取得使用者的候選人名單，並只留下候選人 id
    const candidateIdList = sex_match_pair[userId].flatMap(
      (candidate) => +Object.keys(candidate)
    );
    // console.log("candidateIdList", candidateIdList);

    // sex_match_pair 改回原本的格式
    sex_match_pair[userId] = candidateIdList;
  }

  for (const userId in sex_match_pair) {
    // 取得使用者的候選人名單
    const candidateIdList = sex_match_pair[userId];
    // console.log("candidateIdList", candidateIdList);

    candidateIdList.forEach((candidateId, index) => {
      // 取得候選人本身的口袋名單
      const shortlistOfCandidate = sex_match_pair[candidateId];
      // console.log("shortlistOfCandidate", shortlistOfCandidate);

      // 如果對方的口袋名單沒有自己，就把對方從自己的候選人名單刪除
      if (!shortlistOfCandidate.includes(+userId)) {
        delete candidateIdList[index]; // 此位置會變成 empty items
      }
    });

    // 清掉 array 裡的 empty items
    sex_match_pair[userId] = candidateIdList.filter(
      (candidateId) => candidateId
    );
  }

  // console.log("最終篩選年齡版本:", sex_match_pair);

  // Step3: 以相同 tag 的數量去排序候選人
  // 列出各個使用者總共的 tag_id
  const user_tags_pair = {};
  for (let userId of allUserIds) {
    let tagIds = await getMatchTagIds(userId);
    tagIds = tagIds.map((tagObj) => tagObj.tag_id);

    user_tags_pair[userId] = tagIds;
  }
  // console.log("user_tags_pair", user_tags_pair);

  // Step3: 以興趣排序候選人名單
  // 把使用者的候選人名單加上相同興趣 tag 數量
  for (const userId in sex_match_pair) {
    // 取得使用者的候選人名單
    const candidateIdList = sex_match_pair[userId];

    candidateIdList.forEach((candidateId, index) => {
      // 計算有多少個相同的 tag 數量
      let tagCount = 0;

      // candidate 有哪些 tag_id
      const candidateTagIds = user_tags_pair[candidateId];
      candidateTagIds.forEach((tagId) => {
        // 如果 candidate 的 tag 有在使用者的 tag list 裡面，count 就加一
        if (user_tags_pair[userId].includes(tagId)) {
          tagCount++;
        }
      });

      // 創造 key-value pair: {candidateId: tagCount}
      const candidate_TagCount_pair = { candidateId, tagCount };

      // 把使用者的候選人名單加上相同的 tag 數量
      candidateIdList[index] = candidate_TagCount_pair;
    });
  }
  // console.log("加上相同的 tag 數量:", sex_match_pair);

  // 依照 tag 數量去排序
  for (const userId in sex_match_pair) {
    // 取得使用者的候選人名單
    const candidateIdList = sex_match_pair[userId];
    candidateIdList.sort(compareNumbers);
  }
  // console.log("排序過後:", sex_match_pair);

  // sex_match_pair 改回原本的格式
  for (const userId in sex_match_pair) {
    // 取得使用者的候選人名單，並只留下候選人 id
    const candidateIdList = sex_match_pair[userId].map(
      (candidate) => candidate.candidateId
    );
    // console.log("userId", userId, "candidateIdList", candidateIdList);

    // sex_match_pair 改回原本的格式
    sex_match_pair[userId] = candidateIdList;
  }

  console.log("sex_match_pair 最終版排序後:", sex_match_pair);

  // ------------------------- 篩選結束 -------------------------

  // TODO: 驗證 token 是否正確

  // FIXME: 刪除所有使用者的 "candidate" 名單 (太激烈了)
  await deleteAllRowInTable("user_candidate");

  // 存新的所有 "candidate" 到 cache & DB
  await saveCandidatesToCache(sex_match_pair);
  await saveCandidatesToDB(sex_match_pair);

  res.json({ data: "Successfully update candidateId list" });
};

// 針對新註冊的使用者，篩選合適的 candidate 給他
const suggestCandidateToNewOne = async (req, res) => {
  const { newuserid } = req.body;

  allUserIds = await getAllUserIds(); // [ 1, 2, 3, 4 ];
  // console.log("allUserIds", allUserIds);

  // Step1: 篩選候選人符合自己設定的性別/性傾向
  const potentialList = {};
  for (let userId of allUserIds) {
    potentialList[userId] = await preSexMatching(userId, allUserIds);
  }
  // console.log("step1-1 potentialList:", potentialList);

  // 確認對方的候選人清單有沒有自己
  for (const userId in potentialList) {
    // 取得每個使用者的候選人名單
    let candidateIdList = potentialList[userId];
    // console.log("candidateIdList", candidateIdList);

    candidateIdList.forEach((candidateId, index) => {
      // 取得候選人本身的口袋名單
      const shortlistOfCandidate = potentialList[candidateId];
      // console.log("shortlistOfCandidate", shortlistOfCandidate);

      // 如果對方的口袋名單沒有自己，就把對方從自己的候選人名單刪除
      if (!shortlistOfCandidate.includes(+userId)) {
        delete candidateIdList[index]; // 此位置會變成 empty items
      }
    });

    // 清掉 array 裡的 empty items
    potentialList[userId] = candidateIdList.filter(
      (candidateId) => candidateId
    );
  }
  // console.log("step1-2 potentialList:", potentialList);

  // 把使用者的候選人名單加上年齡
  for (const userId in potentialList) {
    // 取得使用者的候選人名單
    const candidateList = potentialList[userId];
    for (let i = 0; i < candidateList.length; i++) {
      const candidateId = candidateList[i];

      // 取得每一個候選人的詳細資訊
      const candidateInfo = await getUserMatchInfo(candidateId);

      // 取得候選人的年齡
      const candidateBirthday = `${candidateInfo.birth_year}/${candidateInfo.birth_month}/${candidateInfo.birth_date}`;
      const candidateAge = getAge(candidateBirthday);

      // 創造 key-value pair: {candidateId: candidateAge}
      const candidateIdAgePair = {};
      candidateIdAgePair[candidateId] = candidateAge;

      // 把使用者的候選人名單加上年齡
      candidateList[i] = candidateIdAgePair;
    }
  }
  // console.log("step2-0(add age) potentialList:", potentialList);

  // Step2: 篩選候選人符合自己設定的年齡條件
  for (const userId in potentialList) {
    // 取得使用者希望的年齡區間
    const desireAgeRange = await getUserDesireAgeRange(userId);
    // console.log("desireAgeRange", desireAgeRange);

    // 取得使用者的候選人名單
    const candidateList = potentialList[userId];

    for (let i = 0; i < candidateList.length; i++) {
      // 取得候選人的年齡
      const candidateAge = Object.values(candidateList[i])[0];

      // 如果候選人不在使用者希望的年齡區間，刪除候選人
      if (
        candidateAge < desireAgeRange.seek_age_min ||
        candidateAge > desireAgeRange.seek_age_max
      ) {
        delete candidateList[i];
      }
    }

    // 清掉 array 裡的 empty items
    potentialList[userId] = candidateList.filter((candidate) => candidate);
  }
  // console.log("step2-1 potentialList:", potentialList);

  //  取得使用者的候選人名單，並只留下候選人 id
  for (const userId in potentialList) {
    const candidateIdList = potentialList[userId].flatMap(
      (candidate) => +Object.keys(candidate)
    );
    // console.log("candidateIdList", candidateIdList);

    // potentialList 改回原本的格式
    potentialList[userId] = candidateIdList;
  }
  // console.log("step2-2 potentialList:", potentialList);

  // 確認對方的候選人清單有沒有自己
  for (const userId in potentialList) {
    // 取得使用者的候選人名單
    const candidateIdList = potentialList[userId];
    // console.log("candidateIdList", candidateIdList);

    candidateIdList.forEach((candidateId, index) => {
      // 取得候選人本身的口袋名單
      const shortlistOfCandidate = potentialList[candidateId];
      // console.log("shortlistOfCandidate", shortlistOfCandidate);

      // 如果對方的口袋名單沒有自己，就把對方從自己的候選人名單刪除
      if (!shortlistOfCandidate.includes(+userId)) {
        delete candidateIdList[index]; // 此位置會變成 empty items
      }
    });

    // 清掉 array 裡的 empty items
    potentialList[userId] = candidateIdList.filter(
      (candidateId) => candidateId
    );
  }
  // console.log("step2-3 potentialList:", potentialList);

  // 列出各個使用者總共的 tag_id
  const user_tags_pair = {};
  for (let userId of allUserIds) {
    let tagIds = await getMatchTagIds(userId);
    tagIds = tagIds.map((tagObj) => tagObj.tag_id);

    user_tags_pair[userId] = tagIds;
  }
  // console.log("step3-0 user_tags_pair", user_tags_pair);

  // Step3: 以相同 tag 的數量去排序候選人

  // 把使用者的候選人名單加上相同興趣 tag 數量
  for (const userId in potentialList) {
    // 取得使用者的候選人名單
    const candidateIdList = potentialList[userId];

    candidateIdList.forEach((candidateId, index) => {
      // 計算有多少個相同的 tag 數量
      let tagCount = 0;

      // candidate 有哪些 tag_id
      const candidateTagIds = user_tags_pair[candidateId];
      candidateTagIds.forEach((tagId) => {
        // 如果 candidate 的 tag 有在使用者的 tag list 裡面，count 就加一
        if (user_tags_pair[userId].includes(tagId)) {
          tagCount++;
        }
      });

      // 創造 key-value pair: {candidateId: tagCount}
      const candidate_TagCount_pair = { candidateId, tagCount };

      // 把使用者的候選人名單加上相同的 tag 數量
      candidateIdList[index] = candidate_TagCount_pair;
    });
  }
  // console.log("step3-1 potentialList", potentialList);

  // 依照 tag 數量去排序
  for (const userId in potentialList) {
    // 取得使用者的候選人名單
    const candidateIdList = potentialList[userId];
    candidateIdList.sort(compareNumbers);
  }
  // console.log("step3-2 potentialList", potentialList);

  // potentialList 改回原本的格式
  for (const userId in potentialList) {
    // 取得使用者的候選人名單，並只留下候選人 id
    const candidateIdList = potentialList[userId].map(
      (candidate) => candidate.candidateId
    );
    // console.log("userId", userId, "candidateIdList", candidateIdList);

    // potentialList 改回原本的格式
    potentialList[userId] = candidateIdList;
  }
  // console.log("step3-3 potentialList", potentialList);
  // ------------------------- 篩選結束 -------------------------

  // TODO: 驗證 token 是否正確

  // 取得新註冊者的 potentialList
  const potentialListOfCertainUser = potentialList[newuserid];

  // 如果新註冊者的配對條件沒有任何人符合，回傳錯誤
  if (!potentialListOfCertainUser) {
    res.json({
      data: { error: "抱歉，目前沒有合適的人選推薦給您，要再更改配對條件嗎?" },
    });
    return;
  }

  // 把新註冊者的 potentialList 存進 DB & cache
  await saveCandidatesOfCertainUser(newuserid, potentialListOfCertainUser);
  await saveCandidatesOfCertainUserToCache(
    newuserid,
    potentialListOfCertainUser
  );

  // 把新註冊者的詳細資訊存到 cache
  const sexType = { 1: "男性", 2: "女性" };
  const newUserInfo = await getUserDetailInfo(newuserid);
  const candidateBirthday = `${newUserInfo.birth_year}/${newUserInfo.birth_month}/${newUserInfo.birth_date}`;
  const age = getAge(candidateBirthday);
  const sex = sexType[newUserInfo.sex_id];
  const imageUrl = `images/${newUserInfo.main_image}`;
  newUserInfo.age = age;
  newUserInfo.sex = sex;
  newUserInfo.main_image = imageUrl;
  delete newUserInfo.sex_id;
  delete newUserInfo.birth_year;
  delete newUserInfo.birth_month;
  delete newUserInfo.birth_date;

  if (Cache.ready) {
    await Cache.hset(`candidate_info_id#${newUserInfo.id}`, newUserInfo);
  }

  res.json({ data: { userId: newuserid, potentialListOfCertainUser } });
};

// 輸出特定使用者的候選人 API ( cache miss 時改撈 DB)
const certainUserCandidateList = async (req, res) => {
  // FIXME: 改從 authentication 拿 user id
  const { userid } = req.body;
  let candidateList;
  try {
    candidateList = await getAllCandidateFromCache(userid);
  } catch (error) {
    console.error("Cannot get candidate list from cache. Error:", error);

    console.log("Get candidate list from DB");
    candidateList = await getCandidatesFromDB(userid);
  }

  const userCandidatePair = {};
  userCandidatePair[userid] = candidateList;

  const response = { data: [] };

  response.data.push(userCandidatePair);

  res.status(200).json(response);
  return;
};

// 輸出特定使用者的追求者 API ( cache miss 時改撈 DB)
const certainUserPursuerList = async (req, res) => {
  // FIXME: 改從 authentication 拿 user id
  const { userid } = req.body;

  let pursuerList;

  try {
    pursuerList = await getPursuerFromCache(userid);
  } catch (error) {
    console.error("Cannot get pursuer list from cache. Error:", error);

    console.log("Get pursuer list from DB");
    pursuerList = await getPursuersFromDB(userid);
  }

  const userPursuertePair = {};
  userPursuertePair[userid] = pursuerList;

  const response = { data: [] };

  response.data.push(userPursuertePair);

  res.status(200).json(response);
  return;
};

//  FIXME: 輸出成 API 格式 (要改成輸入進去 DB 和 cache，而非直接餵給 API)
const AllUserCandidateList = async (req, res) => {
  const response = { data: [] };

  for (const userId in sex_match_pair) {
    const userId_candidateIds_pair = {
      id: userId,
      candidateIdList: sex_match_pair[userId],
    };
    response.data.push(userId_candidateIds_pair);
  }

  res.status(200).json(response);
  return;
};

export {
  suggestCandidateToAllUsers,
  suggestCandidateToNewOne,
  certainUserCandidateList,
  certainUserPursuerList,
  AllUserCandidateList,
};
