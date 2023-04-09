import { client } from "../util/util.js";

const saveChatRecordToES = async () => {
  const indexName = "chatting";

  // TODO: 取得儲存資料

  try {
    // TODO: 儲存格式
    const result = await client.index({
      index: indexName,
      body: {
        name: "",
        time: "",
        message: "",
      },
    });
  } catch (err) {}
};
