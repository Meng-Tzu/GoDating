import {
  getAllUserIds,
  getUserInfo1,
  getUserDesireAgeRange,
  getMatchTag1,
} from "../models/user_model.js";

// -------------------------- Function 區塊 -------------------------------

// Function1: 篩選其他人的性別是否符合自己的性傾向
const preSexMatching = async (selfId) => {
  // 排除自己的 id
  let match1_candidate_ids = allUserIds.filter((userId) => userId !== selfId);
  const self = await getUserInfo1(selfId);

  if (self.orientation_id === 3 || self.orientation_id === 6) {
    // 雙性戀, 摸索中 -> 全選
  } else if (self.orientation_id === 2) {
    // 同性戀
    const candidates = [];
    for (let userId of match1_candidate_ids) {
      const candidate = await getUserInfo1(userId);
      if (candidate.sex_id === self.orientation_id) {
        candidates.push(userId);
      }
    }
    match1_candidate_ids = candidates;
  } else if (self.orientation_id === 1) {
    // FIXME: 異性戀 (有沒有更聰明的篩選?)
    let sex = [1, 2];
    // 剔除自己的性別 id
    delete sex[self.orientation_id - 1];
    sex = sex.filter((sexId) => sexId > 0);

    const candidates = [];
    for (let userId of match1_candidate_ids) {
      const candidate = await getUserInfo1(userId);
      if (candidate.sex_id === sex[0]) {
        candidates.push(userId);
      }
    }
    match1_candidate_ids = candidates;
  }

  return match1_candidate_ids;
};

// Function2: 計算每一個人的年齡
const getAge = (dateString) => {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  // 如果今天還沒到自己的生日月份，或還沒到自己生日當天，age 要減一歲
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Function3: 排序規則
const compareNumbers = (a, b) => {
  return b.tagCount - a.tagCount;
};

// ---------------------------- 篩選開始！ --------------------------------

// FIXME: 取得所有使用者 id -> 有必要嗎?
const allUserIds = await getAllUserIds(); // [ 1, 2, 3, 4 ];
// console.log("allUserIds", allUserIds);

// Step1: 篩選候選人符合自己設定的性別/性傾向
const sex_match_pair = {};
for (let userId of allUserIds) {
  sex_match_pair[userId] = await preSexMatching(userId);
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
  sex_match_pair[userId] = candidateIdList.filter((candidateId) => candidateId);
}
// console.log("after: userId_cadidateId", sex_match_pair);

// 把使用者的候選人名單加上年齡
for (const userId in sex_match_pair) {
  // 取得使用者的候選人名單
  const candidateList = sex_match_pair[userId];
  for (let i = 0; i < candidateList.length; i++) {
    const candidateId = candidateList[i];

    // 取得每一個候選人的詳細資訊
    const candidateInfo = await getUserInfo1(candidateId);

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
  sex_match_pair[userId] = candidateIdList.filter((candidateId) => candidateId);
}

// console.log("最終篩選年齡版本:", sex_match_pair);

// Step3: 以相同 tag 的數量去排序候選人
// 列出各個使用者總共的 tag_id
const user_tags_pair = {};
for (let userId of allUserIds) {
  let tagIds = await getMatchTag1(userId);
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

// console.log("sex_match_pair 最終版排序後:", sex_match_pair);

//  輸出成 API 格式
const userMatchList = async (req, res) => {
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

export { userMatchList };
