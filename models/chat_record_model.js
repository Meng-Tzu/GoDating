import { client } from "../util/util.js";

// FIXME: 清除 chatting index 內的所有資料 (針對不同聊天室處理)
const deleteChatRecordFromElasticsearch = async () => {
  const indexName = "chatting";

  await client.indices.delete({ index: indexName, ignore_unavailable: true });
  console.log(`delete index "${indexName}" successfully`);
};

// FIXME: 在 elasticsearch 創建 index 並設定規則 (針對不同聊天室處理)
const initElasticsearch = async () => {
  const indexName = "chatting";

  await client.indices.create({
    index: indexName,
    body: {
      mappings: {
        properties: {
          userId: {
            type: "integer",
          },
          userName: {
            type: "text",
          },
          message: {
            type: "text",
          },
          timestamp: {
            type: "text",
          },
          time: {
            type: "float",
          },
        },
      },
      settings: {
        analysis: {
          default: {
            analyzer: "ik_max_word",
            tokenizer: "ik_max_word",
          },
        },
      },
    },
  });
  console.log(`init index "${indexName}" successfully`);
};

// TODO: 將聊天紀錄存入 Elasticsearch 中 (針對不同聊天室處理)
const saveChatRecordToES = async (
  userId,
  userName,
  message,
  timestamp,
  time
) => {
  const indexName = "chatting";

  // TODO: 儲存格式
  const result = await client.index({
    index: indexName,
    body: {
      userId,
      userName,
      message,
      timestamp,
      time,
    },
  });

  //  更新 index
  await client.indices.refresh({ index: indexName });

  return result;
};

export {
  deleteChatRecordFromElasticsearch,
  initElasticsearch,
  saveChatRecordToES,
};
