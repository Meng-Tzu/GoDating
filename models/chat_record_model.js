import { client } from "../util/util.js";

// FIXME: 清除 chatting index 內的所有資料 (針對不同聊天室處理)
const deleteChatRecordFromElasticsearch = async () => {
  const indexName = "test1";

  await client.indices.delete({ index: indexName, ignore_unavailable: true });
  console.log(`delete index "${indexName}" successfully`);
};

// FIXME: 在 elasticsearch 創建 index 並設定規則 (針對不同聊天室處理)
const initElasticsearch = async () => {
  const indexName = "test1";

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
            type: "date",
            format: "epoch_millis",
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

// (async () => {
//   await initElasticsearch();
// })();

// TODO: 將聊天紀錄存入 Elasticsearch 中 (針對不同聊天室處理)
const saveChatRecordToES = async (
  userId,
  userName,
  message,
  timestamp,
  time
) => {
  const indexName = "test1";

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

// TODO: 搜尋所有 chatting 內的對話紀錄
const searchAllFromChatting = async () => {
  const indexName = "test1";

  const searchResponse = await client.search({
    index: indexName,
    body: {
      query: {
        match_all: {},
      },
      sort: [{ time: { order: "desc" } }],
    },
  });

  const result = searchResponse.hits.hits;
  const messages = result.map((message) => message._source);
  return messages;
};

// TODO: 搜尋 elasticSearch 的 chatting 特定關鍵字
const searchKeywordFromChatting = async (keyword) => {
  const indexName = "test1";

  const searchResponse = await client.search({
    index: indexName,
    body: {
      query: {
        multi_match: {
          query: keyword,
          type: "most_fields",
          fields: ["message"],
          operator: "AND",
          fuzziness: 2,
          prefix_length: 3,
        },
      },
      sort: [{ time: { order: "desc" } }],
    },
  });

  const result = searchResponse.hits.hits;
  const messages = result.map((message) => message._source);
  return messages;
};

export {
  deleteChatRecordFromElasticsearch,
  initElasticsearch,
  saveChatRecordToES,
  searchAllFromChatting,
  searchKeywordFromChatting,
};
