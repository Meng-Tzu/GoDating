import {
  deleteChatRecordFromElasticsearch,
  initElasticsearch,
  saveChatRecordToES,
} from "../models/chat_record_model.js";

const saveChatRecord = async (req, res) => {
  console.log("req123", req);
  console.log("req.body", req.body);
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
    const response = { record };
    console.log("save into ES successfully", response);
    res.status(200).json(response);
    return;
  } catch (error) {
    const response = { error };
    console.error(
      "存入 ES 錯誤, check client.index() or client.indices.refresh() :",
      error
    );

    res.status(500).json(response);
    return;
  }
};

export { saveChatRecord };
