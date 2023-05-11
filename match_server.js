// 導入模組
import express from "express";
import { Server } from "socket.io";
import { writeFile, createReadStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { uniqueSuffix } from "./util/random.js";

const __filename = fileURLToPath(import.meta.url);
// console.log(__filename);

const __dirname = path.dirname(__filename);
console.log(__dirname);

//創建 express 的物件
const app = express();

// 取得 static html file
app.use("/", express.static("public"));

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
let webSrv = app.listen(3030, () =>
  console.log("Server is running on port 3000.")
);

// ----------------------------- SocketIO 區塊 --------------------------------

//將 express 交給 SocketServer 開啟 SocketIO 的服務
const io = new Server(webSrv);

// 目前有幾條連線
let count = 0;

// 如何儲存哪個連線是誰
let connections = {};

// // 回覆的訊息格式
// const response = {};

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

  // FIXME: 儲存連線者 (以 user_id 當 key 去儲存連線嗎?)
  socket.on("online", (user) => {
    const id = user.id;
    const name = user.name;

    connections[id] = { name, socket };
    // console.log("connections", connections);

    console.log(`user id #${id} successfully connect.`);
    const response = {
      system: "System Broadcast",
      name,
      message: `${name} is online.`,
    };
    // 告知使用者已成功連線
    socket.emit("userConnect", id);

    // TODO: 告知所有人該使用者已上線 (add timestamp)
    io.emit("allMessage", response);
  });

  socket.on("message", (msg) => {
    // 回覆的訊息格式
    const response = {};
    // console.log("msg", msg, typeof msg);

    // console.log("connections", connections);
    let userId = getKeyByValue(socket);
    response.id = userId;
    response.name = connections[userId].name;

    // 傳送訊息時間
    const time = new Date();
    response.timestamp = time.toLocaleString("en-US", {
      timeZone: "Asia/Taipei",
    });
    response.msOfTime = Date.now();

    if (msg.receiver === "ALL") {
      response.message = msg.content;
      // 針對所有連線去傳送訊息
      io.emit("allMessage", response);
    } else if (!(msg.receiver in connections)) {
      socket.emit("notExist", `This person is not online.`);
    } else {
      response.message = msg.content;
      // 針對 receiver 的這條連線去傳送訊息
      connections[msg.receiver].socket.emit("message", response);
      // TODO: user 可以看到自己傳的訊息是什麼  (add timestamp)
    }
  });

  socket.on("upload", (msg, callback) => {
    console.log(msg.file); // <Buffer 25 50 44 ...>

    // 回覆的訊息格式
    const response = {};

    let userId = getKeyByValue(socket);
    response.id = userId;
    response.name = connections[userId].name;

    // 傳送訊息時間
    const time = new Date();
    response.timestamp = time.toLocaleString("en-US", {
      timeZone: "Asia/Taipei",
    });
    response.msOfTime = Date.now();

    // save the content to the disk
    let filename = `${uniqueSuffix()}.jpg`; // 自動編號照片名稱
    // console.log("filename", filename);

    writeFile(`upload/${filename}`, msg.file, (err) => {
      if (err) {
        socket.error = "system alert -> This picture cannot display.";
        io.emit("wholeFile", response);
      } else {
        console.log("successfully save");
        // FIXME: 讀取硬碟中的圖片 (解析度跑掉)
        let readStream = createReadStream(
          path.join(__dirname, `/upload/${filename}`),
          {
            encoding: "binary",
          }
        );

        let chunks = [];

        if (msg.receiver === "ALL") {
          // 針對所有連線去傳送訊息
          readStream.on("readable", () => {
            console.log("Image loading");
            let chunk;
            while ((chunk = readStream.read()) !== null) {
              chunks.push(chunk);
              io.emit("file", chunk);
            }
          });

          // 顯示圖片
          readStream.on("end", () => {
            console.log("Image loaded");
            response.status = "success";
            io.emit("wholeFile", response);
          });
        } else if (!(msg.receiver in connections)) {
          socket.emit("notExist", `This person is not online.`);
        } else {
          // 針對 receiver 的這條連線去傳送訊息
          // connections[msg.receiver].emit("message", response);

          readStream.on("readable", () => {
            console.log("Image loading");
            let chunk;
            while ((chunk = readStream.read()) !== null) {
              chunks.push(chunk);
              connections[msg.receiver].socket.emit("file", chunk);
            }
          });

          // 顯示圖片
          readStream.on("end", () => {
            console.log("Image loaded");
            response.status = "success";
            connections[msg.receiver].socket.emit("wholeFile", response);
          });
        }
      }
    });
  });

  // FIXME: 監聽 client 是否已經斷開連線 (可做哪個使用者已離開)
  socket.on("disconnect", () => {
    count--;
    console.log(`One client has disconnected. 目前連線數: ${count}`);
  });
});
