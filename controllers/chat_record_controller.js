import {
  deleteChatIndexFromES,
  initChatIndexOfES,
  saveChatRecordToES,
  searchAllChatFromES,
  searchKeywordFromES,
} from "../models/chat_record_model.js";

// FIXME: 刪除聊天記錄的 index (不能由前端去處理資料，前端僅供查詢)
const deleteChatIndex = async (req, res) => {
  const { indexId } = req.body;

  try {
    await deleteChatIndexFromES(indexId);
    const response = { data: `successfully delete chat#${indexId}` };
    res.json(response);
  } catch (error) {
    console.error("delete index error:", error);
    res.status(500).json({ error: "Cannot delete chat index normally." });
  }
};

// FIXME: 創建聊天記錄的 index (不能由前端去處理資料，前端僅供查詢)
const creatChatIndex = async (req, res) => {
  const { indexId } = req.body;

  try {
    await initChatIndexOfES(indexId);
    const response = { data: `successfully create chat#${indexId}` };
    res.json(response);
  } catch (error) {
    console.error("init index error:", error);
    res.status(500).json({ error: "Cannot init chat index normally." });
  }
};

// FIXME: 存入聊天記錄 (不能由前端去處理資料，前端僅供查詢)
const saveChatRecord = async (req, res) => {
  const { indexId, userId, userName, message, timestamp, time } = req.body;

  // 存入 ES
  try {
    const record = await saveChatRecordToES(
      indexId,
      +userId,
      userName,
      message,
      timestamp,
      +time
    );
    const response = { data: record };
    console.log("save into ES successfully");
    res.status(200).json(response);
    return;
  } catch (error) {
    const response = { data: error };
    console.error(
      "save into index error, check client.index() or client.indices.refresh():",
      error
    );

    res.status(500).json(response);
    return;
  }
};

// FIXME: 載入所有聊天記錄
const loadAllChatRecord = async (req, res) => {
  const { indexId } = req.body;

  try {
    let messages = await searchAllChatFromES(indexId);
    messages = { data: messages };
    res.json(messages);
  } catch (error) {
    console.error("load all record error:", error);
    res.status(500).json({ error: "Cannot load all chat record normally." });
  }
};

// FIXME: 搜尋聊天關鍵字
const searchChatRecord = async (req, res) => {
  const { indexId, keyword } = req.body;

  try {
    let messages = await searchKeywordFromES(indexId, keyword);
    messages = { data: messages };
    res.json(messages);
  } catch (error) {
    console.error("search certain record error:", error);
    res.status(500).json({ error: "Cannot search certain record normally." });
  }
};

export {
  deleteChatIndex,
  creatChatIndex,
  saveChatRecord,
  loadAllChatRecord,
  searchChatRecord,
};
