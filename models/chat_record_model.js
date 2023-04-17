import { client } from "../util/util.js";

// 清除 chatting index 內的所有資料
const deleteChatIndexFromES = async (indexName) => {
  await client.indices.delete({ index: indexName, ignore_unavailable: true });
  console.log(`delete index "${indexName}" successfully`);
};

// 在 elasticsearch 創建 index 並設定規則
const initChatIndexOfES = async (indexName) => {
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

// 將聊天紀錄存入 ES 中
const saveChatRecordToES = async (
  indexName,
  userId,
  userName,
  message,
  timestamp,
  time
) => {
  // 儲存格式
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

// 搜尋所有 chatting 內的對話紀錄 ( Scroll 功能可顯示超過 10 筆資料)
const searchAllChatFromES = async (indexName) => {
  const searchParams = {
    index: indexName,
    scroll: "1m", // 設定 Scroll API 的 scroll 時間
    body: {
      query: {
        match_all: {},
      },
      sort: [{ time: { order: "asc" } }],
      size: 10,
    },
  };

  const searchResponse = await client.search(searchParams);
  let scrollId = searchResponse._scroll_id;

  // 處理完第一次的搜尋結果， result 變數包含了搜尋結果的資料
  let initialResult = searchResponse.hits.hits;
  const messages = initialResult.map((message) => message._source);

  // 使用 scrollId 來繼續滾動搜尋結果
  while (initialResult.length > 0) {
    const scrollResponse = await client.scroll({
      scroll_id: scrollId,
      scroll: "1m", // 每次滾動都需要指定 scroll 時間
    });

    const scrollResult = scrollResponse.hits.hits;
    scrollResult.forEach((message) => messages.push(message._source));

    if (!scrollResult.length) {
      // 如果滾動後的資料為空，則退出迴圈
      break;
    }

    scrollId = scrollResponse._scroll_id;
    initialResult = scrollResult;
  }

  // 最後記得清除 Scroll API 上下文
  await client.clearScroll({ scroll_id: scrollId });

  return messages;
};

// 搜尋 elasticSearch 的 chatting 特定關鍵字 ( Scroll 功能可顯示超過 10 筆資料)
const searchKeywordFromES = async (indexName, keyword) => {
  const searchParams = {
    index: indexName,
    scroll: "1m", // 設定 Scroll API 的 scroll 時間
    body: {
      query: {
        multi_match: {
          query: keyword,
          type: "most_fields",
          fields: ["message"],
          operator: "OR",
          fuzziness: 2,
          prefix_length: 3,
        },
      },
      sort: [{ time: { order: "desc" } }],
      size: 10,
    },
  };

  const searchResponse = await client.search(searchParams);
  let scrollId = searchResponse._scroll_id;

  // 處理完第一次的搜尋結果， result 變數包含了搜尋結果的資料
  let initialResult = searchResponse.hits.hits;
  const messages = initialResult.map((message) => message._source);

  // 使用 scrollId 來繼續滾動搜尋結果
  while (initialResult.length > 0) {
    const scrollResponse = await client.scroll({
      scroll_id: scrollId,
      scroll: "1m", // 每次滾動都需要指定 scroll 時間
    });

    const scrollResult = scrollResponse.hits.hits;
    scrollResult.forEach((message) => messages.push(message._source));

    if (!scrollResult.length) {
      // 如果滾動後的資料為空，則退出迴圈
      break;
    }

    scrollId = scrollResponse._scroll_id;
    initialResult = scrollResult;
  }

  // 最後記得清除 Scroll API 上下文
  await client.clearScroll({ scroll_id: scrollId });

  return messages;
};

// (async () => {
//   await deleteChatIndexFromES();
// })();

export {
  deleteChatIndexFromES,
  initChatIndexOfES,
  saveChatRecordToES,
  searchAllChatFromES,
  searchKeywordFromES,
};
