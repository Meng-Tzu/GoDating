import Cache from "../util/cache.js";

// 取得使用者的 who_like_me
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

// 儲存使用者的 who_like_me
const saveWhoLikeMeOfOtherSide = async (
  userId,
  potentialCondidateId,
  potentialCondidateName
) => {
  try {
    if (Cache.ready) {
      await Cache.hset(
        `who_like_me_of_userid#${userId}`,
        potentialCondidateId,
        potentialCondidateName
      );
      console.log(
        `successfully save who_like_me of userId#${userId} into cache`
      );
    }
  } catch (error) {
    console.error(`cannot save who_like_me into cache:`, error);
  }
};

export { getWhoLikeMeOfSelf, saveWhoLikeMeOfOtherSide };
