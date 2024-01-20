import { getUserMatchInfo } from "../../models/user_model.js";

import {
  excludeMyselfId,
  selectBySexualOrientation,
} from "../../controllers/match_controller.js";

// TODO: 使用 jest.fn() mock function
// const getUserMatchInfo = jest.fn((userId) => {
//   switch (userId) {
//     case 1:
//       return { sex_id: 2, orientation_id: 2 };
//     case 2:
//       return { sex_id: 1, orientation_id: 3 };
//     case 3:
//       return { sex_id: 2, orientation_id: 1 };
//     case 4:
//       return { sex_id: 1, orientation_id: 2 };
//     case 5:
//       return { sex_id: 2, orientation_id: 3 };
//     default:
//       return {};
//   }
// });
// jest.mock("../../models/user_model.js", () => ({
//   getUserMatchInfo: jest.fn(),
// }));

// 假資料
const usersInfo = {
  1: { sex_id: 2, orientation_id: 2 },
  2: { sex_id: 1, orientation_id: 3 },
  3: { sex_id: 2, orientation_id: 1 },
  4: { sex_id: 1, orientation_id: 2 },
  5: { sex_id: 2, orientation_id: 3 },
};

describe("match-process", () => {
  it("exclude my user id from all users list", () => {
    const myUserId = 3;
    const allUserId = [1, 2, 3, 4, 5, 6, 7];
    expect(excludeMyselfId(myUserId, allUserId)).toStrictEqual([
      1, 2, 4, 5, 6, 7,
    ]);
  });

  beforeEach(() => {
    jest
      .spyOn(getUserMatchInfo, "getUserMatchInfo")
      .mockImplementation((userId) => {
        return usersInfo[userId];
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("if user is female and is Heterosexuality", async () => {
    const myId = 1;
    const userCandidatesPair = [2, 3, 4, 5];
    const expected = [3, 5];

    const result = await selectBySexualOrientation(myId, userCandidatesPair);
    expect(result).toEqual(expected);
  });
});
