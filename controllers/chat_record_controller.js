import {
  deleteChatRecordFromElasticsearch,
  initElasticsearch,
  saveChatRecordToES,
  searchAllFromChatting,
  searchKeywordFromChatting,
} from "../models/chat_record_model.js";

const saveChatRecord = async (req, res) => {
  const userId = +req.body.userId;
  const userName = req.body.userName;
  const message = req.body.message;
  const timestamp = req.body.timestamp;
  const time = +req.body.time;

  // 存入 ES
  try {
    const record = await saveChatRecordToES(
      userId,
      userName,
      message,
      timestamp,
      time
    );
    const response = { data: record };
    console.log("save into ES successfully");
    res.status(200).json(response);
    return;
  } catch (error) {
    const response = { data: error };
    console.error(
      "存入 ES 錯誤, check client.index() or client.indices.refresh() :",
      error
    );

    res.status(500).json(response);
    return;
  }
};

// TODO: 在 elasticsearch 搜尋 products
const searchChatRecord = async (req, res) => {
  let keyword = req.query.keyword;

  try {
    if (keyword) {
      let messages = await searchKeywordFromChatting(keyword);
      messages = { data: messages };
      res.json(messages);
    } else {
      let messages = await searchAllFromChatting();
      messages = { data: messages };
      res.json(messages);
    }
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: "ElasticSearch cannot work normally." });
  }
};

export { saveChatRecord, searchChatRecord };
