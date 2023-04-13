// 導入模組
import express from "express";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

// 導入 Cache
import {
  getWhoLikeMeOfSelf,
  saveWhoLikeMeOfOtherSide,
} from "./controllers/choice_controller.js";

//創建 express 的物件
const app = express();

// 取得 static html file
app.use("/", express.static("public"));
app.use("/", express.static("public/render"));
app.use("/", express.static("public/images"));

// 可使用的 request body 格式
app.use(express.json());

// TODO: API routes (可否共用前面的 path ??)
import { userRouter } from "./routes/user_route.js";
app.use("/api/1.0", [userRouter]);

import { chatRouter } from "./routes/chat_record_route.js";
app.use("/api/1.0", [chatRouter]);

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
const webSrv = app.listen(3030, () =>
  console.log("Server is running on port 3030.")
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
  socket.on("online", (user) => {
    const id = user.id;
    const name = user.name;

    connections[id] = { name, socket };
    // console.log("connections", connections);

    console.log(`user id #${id} successfully connect.`);

    // 告知使用者已成功連線
    socket.emit("user-connect", id);
  });

  // TODO: 監聽到使用者喜歡候選人
  socket.on("desired-candidate", async (msg) => {
    const { userId, userName, condidateId, condidateName } = msg;

    // 查看 Cache 內使用者的 "who_like_me" 內有沒有存在此候選人
    const desiredCandidate = await getWhoLikeMeOfSelf(userId, condidateId);

    if (desiredCandidate) {
      const roomId = uuidv4();

      const responseForSelf = { userId, condidateId, condidateName, roomId };

      const responseForOtherSide = {
        userId: condidateId,
        condidateId: userId,
        condidateName: userName,
        roomId,
      };

      // 傳給自己
      socket.emit("success-match", responseForSelf);

      // 傳給對方
      connections[condidateId].socket.emit(
        "success-be-matched",
        responseForOtherSide
      );

      console.log(
        `Successfully match userId#${userId} with userId#${condidateId}`
      );
    } else {
      // 如果對方尚未喜歡自己，儲存對方的 "who_like_me" 到快取
      await saveWhoLikeMeOfOtherSide(condidateId, userId, userName);
      console.log(
        `userId#${userId}(${userName}) like userId#${condidateId}(${condidateName})`
      );
    }
  });

  // 當有使用者想要建立聊天室
  socket.on("create-room", () => {
    const roomId = uuidv4();
    socket.join(roomId);

    socket.emit("create-room-message", roomId);

    // 取得該 socket 的 id
    let userId = getKeyByValue(socket);
    const userName = connections[userId].name;
    const response = {
      system: "System Broadcast",
      userId,
      userName,
      message: `${userName} has join this room.`,
    };

    io.to(roomId).emit("room-broadcast", response);
  });

  // 當有使用者已經知道聊天室 id 並想加入
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.emit("join-room-message", roomId);

    // 取得該 socket 的 id
    let userId = getKeyByValue(socket);
    const userName = connections[userId].name;
    const response = {
      system: "System Broadcast",
      userId,
      userName,
      message: `${userName} has join this room.`,
    };

    io.to(roomId).emit("room-broadcast", response);
  });

  // TODO: 當有使用者想傳送訊息到聊天室
  socket.on("message", (msg) => {
    const roomId = msg.roomId;
    const userName = msg.userName;
    const message = msg.message;

    // 傳送訊息時間
    const time = new Date();
    const timestamp = time.toLocaleString("en-US", {
      timeZone: "Asia/Taipei",
    });

    const response = { roomId, userName, message, timestamp };

    io.to(roomId).emit("room-broadcast", response);
  });

  // FIXME: 監聽 client 是否已經斷開連線 (可做哪個使用者已離開)
  socket.on("disconnect", () => {
    count--;
    console.log(`One client has disconnected. 目前連線數: ${count}`);
  });
});
