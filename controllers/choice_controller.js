import Cache from "../util/cache.js";

// 取得使用者的 "who_like_me"
const getWhoLikeMeOfSelf = async (userId, potentialCondidateId) => {
  try {
    if (Cache.ready) {
      const result = await Cache.hget(
        `who_like_me_of_userid#${userId}`,
        potentialCondidateId
      );
      console.log(
        `successfully get who_like_me of userId#${userId} from cache`
      );
      return result;
    }
  } catch (error) {
    console.error(`cannot get who_like_me from cache:`, error);
  }
};

// 儲存使用者的 "who_like_me"
const saveWhoLikeMeOfOtherSide = async (userId, suitorId, suitorName) => {
  try {
    if (Cache.ready) {
      await Cache.hset(`who_like_me_of_userid#${userId}`, suitorId, suitorName);
      console.log(
        `successfully save suitorId#${suitorId} into who_like_me of userId#${userId} into cache`
      );
    }
  } catch (error) {
    console.error(`cannot save who_like_me into cache:`, error);
  }
};

// 刪除使用者的 "who_like_me"
const deletePursuerOfUser = async (userId, suitorId) => {
  try {
    if (Cache.ready) {
      await Cache.hdel(`who_like_me_of_userid#${userId}`, suitorId);
    }
  } catch (error) {
    console.error(`cannot delete pursuer from cache:`, error);
  }
};

// 從 cache 刪除 "candidate"
const deleteCandidateOfUser = async (userId, candidateId) => {
  try {
    if (Cache.ready) {
      await Cache.zrem(`candidates_of_userid#${userId}`, candidateId);
    }
  } catch (error) {
    console.error(`cannot delete candidates from cache:`, error);
  }
};

// 儲存使用者的 "never_match"
const saveNeverMatchOfUser = async (userId, candidateId) => {
  try {
    if (Cache.ready) {
      await Cache.sadd(`never_match_of_userid#${userId}`, candidateId);
    }
  } catch (error) {
    console.error(`cannot save never_match into cache:`, error);
  }
};

// 儲存使用者的 "partners"
const savePartnerOfUser = async (
  userId,
  partnerId,
  partnerName,
  partneImage,
  roomId,
  indexId
) => {
  try {
    if (Cache.ready) {
      const chatroomInfo = JSON.stringify([
        partnerName,
        partneImage,
        roomId,
        indexId,
      ]);
      const result = await Cache.hset(
        `partners_of_userid#${userId}`,
        partnerId,
        chatroomInfo
      );
      console.log(`successfully save partners of userId#${userId} into cache`);
      return result;
    }
  } catch (error) {
    console.error(`cannot save partners into cache:`, error);
  }
};

// 取得使用者的 "partners"
const getPartnerOfUser = async (userId, partnerId) => {
  try {
    if (Cache.ready) {
      let result = await Cache.hget(`partners_of_userid#${userId}`, partnerId);

      console.log(`successfully get partners of userId#${userId} from cache`);

      result = JSON.parse(result);

      return result;
    }
  } catch (error) {
    console.error(`cannot get partners from cache:`, error);
  }
};

export {
  getWhoLikeMeOfSelf,
  saveWhoLikeMeOfOtherSide,
  deletePursuerOfUser,
  deleteCandidateOfUser,
  saveNeverMatchOfUser,
  savePartnerOfUser,
  getPartnerOfUser,
};
