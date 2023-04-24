// 導入模組
import express from "express";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { writeFile, createReadStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 導入 Cache function
import {
  getCandidateFromCache,
  getCandidateInfoFromCache,
} from "./models/user_model.js";

import {
  getWhoLikeMeOfSelf,
  saveWhoLikeMeOfOtherSide,
  deleteSuitorOfUser,
  deleteCandidateOfUser,
  saveNeverMatchOfUser,
  savePartnerOfUser,
  getPartnerOfUser,
} from "./controllers/choice_controller.js";

// 導入 ElasticSearch function
import {
  initChatIndexOfES,
  saveChatRecordToES,
  searchKeywordFromES,
} from "./models/chat_record_model.js";

//創建 express 的物件
const app = express();

// 取得 static html file
app.use("/", express.static("public"));
app.use("/", express.static("public/render"));
app.use("/", express.static("public/images"));
app.use("/", express.static("public/uploads"));

// 可使用的 request body 格式
app.use(express.json());

// FIXME: API routes (可否共用前面的 path ??)
import { userRouter } from "./routes/user_route.js";
app.use("/api/1.0", [userRouter]);

import { chatRouter } from "./routes/chat_record_route.js";
app.use("/api/1.0", [chatRouter]);

import { matchRouter } from "./routes/match_route.js";
app.use("/api/1.0", [matchRouter]);

// 當使用者輸入錯的路徑，會直接掉進這個 middle ware
app.use((req, res) => {
  console.log("error request path", req.originalUrl);
  res.status(404).send("The page is not found.");
});

// Error handling
app.use((err, req, res, next) => {
  console.error("err", err);
  res.status(500).send("Internal Server Error");
});

// webserver 聽 3000 port
const webSrv = app.listen(3000, () =>
  console.log("Server is running on port 3000.")
);

// ----------------------------- SocketIO 區塊 --------------------------------

//將 express 交給 SocketServer 開啟 SocketIO 的服務
const io = new Server(webSrv);

// 目前有幾條連線
let count = 0;

// 如何儲存哪個連線是誰
let connections = {};

// FIXME: 找到是誰傳訊息 (如何比遍歷更高效率)
const getKeyByValue = (value) => {
  for (const userId in connections) {
    if (value === connections[userId].socket) {
      return userId;
    }
  }
};

// 監聽 SocketIO 的 connection 事件
io.on("connection", (socket) => {
  count++;
  console.log(`One client has connected. 目前連線數: ${count}`);

  // FIXME: 儲存連線者 (需要儲存嗎???)
  socket.on("online", async (user) => {
    const id = user.id;
    const name = user.name;

    connections[id] = { name, socket };
    // console.log("connections", connections);

    console.log(`user id #${id} successfully connect.`);

    // TODO: 傳送候選人的詳細資訊給使用者 (串接 sursuer & candidate list)
    const candidateList = await getCandidateFromCache(id);
    const candidateIdList = Object.keys(candidateList);

    const testCandidateInfo = await getCandidateInfoFromCache(
      candidateIdList[0]
    );

    const candidateInfoList = [];
    for (const candidateId of candidateIdList) {
      const candidateInfo = await getCandidateInfoFromCache(candidateId);

      candidateInfoList.push(candidateInfo);
    }

    // const response = { id, testCandidateInfo };
    const response = { id, candidateInfoList };

    // 告知使用者已成功連線
    socket.emit("user-connect", response);
  });

  // 監聽到使用者喜歡候選人
  socket.on("desired-candidate", async (msg) => {
    const { userId, userName, condidateId, condidateName } = msg;

    // 對方尚未喜歡自己，把自己儲存到對方的 "who_like_me" 快取
    await saveWhoLikeMeOfOtherSide(condidateId, userId, userName);

    // 從快取把雙方的 "candidate" 刪除彼此
    await deleteCandidateOfUser(userId, condidateId);
    await deleteCandidateOfUser(condidateId, userId);

    // 存進雙方的 "never_match" 到快取
    await saveNeverMatchOfUser(userId, condidateId);
    await saveNeverMatchOfUser(condidateId, userId);

    // 更新自己的 candidate list
    const candidateListOfSelf = await getCandidateFromCache(userId);
    const candidateIdListOfSelf = Object.keys(candidateListOfSelf);
    const candidateInfoListOfSelf = [];
    for (const candidateId of candidateIdListOfSelf) {
      const candidateInfo = await getCandidateInfoFromCache(candidateId);
      candidateInfoListOfSelf.push(candidateInfo);
    }

    // 更新對方的 candidate list
    const candidateListOfOtherSide = await getCandidateFromCache(condidateId);
    const candidateIdListOfOtherSide = Object.keys(candidateListOfOtherSide);
    const candidateInfoListOfOtherSide = [];
    for (const candidateId of candidateIdListOfOtherSide) {
      const candidateInfo = await getCandidateInfoFromCache(candidateId);
      candidateInfoListOfOtherSide.push(candidateInfo);
    }

    // 把自己的資訊送回對方的前端
    const responseForOtherSide = {
      userId: condidateId,
      pursuerId: userId,
      pursuerName: userName,
      candidateInfoList: candidateInfoListOfOtherSide,
    };
    connections[condidateId].socket.emit("who-like-me", responseForOtherSide);

    // 把對方的資訊再次送回給自己的前端
    const responseForSelf = {
      userId,
      condidateId,
      condidateName,
      candidateInfoList: candidateInfoListOfSelf,
    };
    socket.emit("success-send-like-signal", responseForSelf);

    console.log(
      `userId#${userId}(${userName}) like userId#${condidateId}(${condidateName})`
    );
  });

  // 監聽到使用者喜歡追求者
  socket.on("like-pursuer", async (msg) => {
    const { userId, userName, pursuerId, pursuerName } = msg;

    const roomId = uuidv4();

    // 從 cache 把對方從自己的 "who_like_me" 刪除
    await deleteSuitorOfUser(userId, pursuerId);

    // 在 ElasticSearch 建立對話紀錄 index
    const indexId = `chatrecord-${userId}-${pursuerId}`;
    await initChatIndexOfES(indexId);

    // 加入 roomId, indexId 到 cache 的 "partners"
    await savePartnerOfUser(userId, pursuerId, roomId, indexId);
    await savePartnerOfUser(pursuerId, userId, roomId, indexId);

    const responseForSelf = {
      userId,
      partnerId: pursuerId,
      partnerName: pursuerName,
      roomId,
    };

    const responseForOtherSide = {
      userId: pursuerId,
      partnerId: userId,
      partnerName: userName,
      roomId,
    };

    // 傳給自己
    socket.emit("success-match", responseForSelf);

    // 傳給對方
    connections[pursuerId].socket.emit(
      "success-be-matched",
      responseForOtherSide
    );

    console.log(`Successfully match userId#${userId} with userId#${pursuerId}`);
  });

  // 當有使用者想傳送訊息到聊天室
  socket.on("message", async (msg) => {
    const { partnerId, roomId, message } = msg;

    // FIXME: 改從前端拿 user id ??
    const userId = getKeyByValue(socket);
    const userName = connections[userId].name;

    // 把 user 和 partner 都加到這個 room id
    socket.join(roomId);
    connections[partnerId].socket.join(roomId);

    // 傳送訊息時間
    const msOfTime = Date.now();
    const time = new Date();
    const timestamp = time.toLocaleString("en-US", {
      timeZone: "Asia/Taipei",
    });

    // 從快取的 "partner" 拿到 chat index
    const chatroomInfo = await getPartnerOfUser(userId, partnerId);
    const chatIndexId = chatroomInfo[1];

    // 把訊息存入 ES
    await saveChatRecordToES(
      chatIndexId,
      userId,
      userName,
      message,
      timestamp,
      msOfTime
    );

    const response = { roomId, userName, message, timestamp };

    io.to(roomId).emit("room-broadcast", response);
  });

  // 當使用者想傳照片到聊天室
  socket.on("upload", (msg) => {
    const { roomId, partnerId, file } = msg;
    console.log(file); // <Buffer 25 50 44 ...>

    // FIXME: save the content to the disk (上傳到 S3 ??)
    let filename = `${uuidv4()}.jpg`; // 自動編號照片名稱

    // 回覆的訊息格式
    const response = {};
    // FIXME: 改從前端拿 user id ??
    const userId = getKeyByValue(socket);
    const userName = connections[userId].name;

    response.userName = userName;
    response.userId = userId;

    writeFile(`upload/${filename}`, msg.file, (err) => {
      if (err) {
        response.error = `This picture cannot display.`;
        io.emit("wholeFile", response);
        console.log("writeFile fail, error:", err);
      } else {
        // FIXME: 讀取硬碟中的圖片 (解析度跑掉)
        const readStream = createReadStream(
          path.join(__dirname, `/upload/${filename}`),
          {
            encoding: "binary",
          }
        );

        // 拼湊回照片
        let chunks = [];

        // 把 user 和 partner 都加到這個 room id
        socket.join(roomId);
        connections[partnerId].socket.join(roomId);

        // 對聊天室傳送圖片
        readStream.on("readable", () => {
          console.log("Image loading");

          let chunk;
          while ((chunk = readStream.read()) !== null) {
            chunks.push(chunk);
            io.to(roomId).emit("file", chunk);
          }
        });

        // 顯示圖片
        readStream.on("end", () => {
          console.log("Image loaded");
          response.status = "success";
          response.roomId = roomId;

          // 傳送訊息時間
          const time = new Date();
          response.timestamp = time.toLocaleString("en-US", {
            timeZone: "Asia/Taipei",
          });
          response.msOfTime = Date.now();
          io.to(roomId).emit("wholeFile", response);
        });
      }
    });
  });

  // 當使用者想要搜尋對話關鍵字
  socket.on("search", async (msg) => {
    const { userId, partnerId, keyword } = msg;

    // 從快取的 "partner" 拿到 chat index
    const chatroomInfo = await getPartnerOfUser(userId, partnerId);
    const chatIndexId = chatroomInfo[1];

    const result = await searchKeywordFromES(chatIndexId, keyword);
    socket.emit("search-result", result);
  });

  // FIXME: 監聽 client 是否已經斷開連線 (可做哪個使用者已離開)
  socket.on("disconnect", () => {
    count--;
    console.log(`One client has disconnected. 目前連線數: ${count}`);
  });
});
