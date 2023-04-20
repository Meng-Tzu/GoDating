// 導入模組
import express from "express";
import { Server } from "socket.io";
import { writeFile } from "fs";

//創建 express 的物件
const app = express();

// webserver 聽 3000 port
let webSrv = app.listen(3000, () =>
  console.log("Server is running on port 3000.")
);

// 取得 static html file
app.use("/", express.static("public"));

//將 express 交給 SocketServer 開啟 SocketIO 的服務
const io = new Server(webSrv);

// 目前有幾條連線
let count = 0;

// 如何儲存哪個連線是誰
let connections = {};

// FIXME: 找到是誰傳訊息 (如何比遍歷更高效率)
function getKeyByValue(value) {
  return Object.keys(connections).find((key) => connections[key] === value);
}

// 監聽 SocketIO 的 connection 事件
io.on("connection", (socket) => {
  count++;
  console.log(`One client has connected. 目前連線數: ${count}`);

  socket.on("online", (name) => {
    connections[name] = socket;
    // console.log("connections", connections);

    console.log(`${name} successfully connect.`);
    const response = { name, message: `Hello, everyone. I'm ${name}.` };
    io.emit("allMessage", response);
  });

  socket.on("message", (msg) => {
    // console.log("msg", msg, typeof msg);
    const message = JSON.parse(msg);
    // console.log("connections", connections);
    let name = getKeyByValue(socket);
    const response = { name, message: "" };

    if (message.receiver === "ALL") {
      response.message = message.content;

      // 針對所有連線去傳送訊息
      io.emit("allMessage", response);
    } else if (!(message.receiver in connections)) {
      socket.emit("notExist", `This person is not online.`);
    } else {
      response.message = message.content;

      // 針對 receiver 的這條連線去傳送訊息
      connections[message.receiver].emit("message", response);
    }
  });

  // FIXME: 儲存使用者上傳的照片
  socket.on("upload", (file, callback) => {
    console.log(file); // <Buffer 25 50 44 ...>

    // save the content to the disk, for example
    writeFile("upload/test2.jpg", file, (err) => {
      callback({ message: err ? "failure" : "success" });
    });

    // TODO: 傳照片到聊天室
  });

  // FIXME: 監聽 client 是否已經斷開連線 (可做哪個使用者已離開)
  socket.on("disconnect", () => {
    count--;
    console.log(`One client has disconnected. 目前連線數: ${count}`);
  });
});

// index.js
// io.on("connection", function (socket) {
//   console.log("One client has connected.");
//   // 建立一個 "sendMessage" 的監聽
//   socket.on("online", function (name) {
//     console.log(name);
//     // 當收到事件的時候，也發送一個 "allMessage" 事件給所有的連線用戶
//     io.emit("allMessage", `Hello, everyone. I'm ${name}.`);
//   });
// });
