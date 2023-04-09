// 導入模組
import express from "express";
import { Server } from "socket.io";
import { writeFile, createReadStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { uniqueSuffix } from "./util/ramdom.js";

const __filename = fileURLToPath(import.meta.url);
// console.log(__filename);

const __dirname = path.dirname(__filename);
// console.log(__dirname);

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

// // 回覆的訊息格式
// const response = {};

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
    // 回覆的訊息格式
    const response = {};
    // console.log("msg", msg, typeof msg);
    const message = JSON.parse(msg);
    // console.log("connections", connections);
    let name = getKeyByValue(socket);
    response.name = name;

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

  socket.on("upload", (file, callback) => {
    console.log(file); // <Buffer 25 50 44 ...>

    // 回覆的訊息格式
    const response = {};

    let name = getKeyByValue(socket);
    response.name = name;

    // save the content to the disk
    let filename = `${uniqueSuffix()}.jpg`; // 自動編號照片名稱
    // console.log("filename", filename);

    writeFile(`upload/${filename}`, file, (err) => {
      if (err) {
        response.error = "system alert -> This picture cannot display.";
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

        readStream.on("readable", () => {
          console.log("Image loading");
          let chunk;
          while ((chunk = readStream.read()) !== null) {
            chunks.push(chunk);
            io.emit("file", chunk);
          }
        });

        readStream.on("end", () => {
          console.log("Image loaded");
          response.status = "success";
          io.emit("wholeFile", response);
        });
      }
    });

    // FIXME: 直接傳照片到聊天室，不儲存到硬碟 (bug exist)
    // let name = getKeyByValue(socket);
    // response.name = name;

    // response.files = file;
    // io.emit("files", response);
  });

  // FIXME: test whole picture display
  // socket.on("test", (msg) => {
  //   console.log(msg);
  //   // 回覆的訊息格式
  //   const response = {};

  //   let name = getKeyByValue(socket);
  //   response.name = name;
  //   response.status = msg;
  //   io.emit("wholeFile", response);
  // });

  // FIXME: 監聽 client 是否已經斷開連線 (可做哪個使用者已離開)
  socket.on("disconnect", () => {
    count--;
    console.log(`One client has disconnected. 目前連線數: ${count}`);
  });
});
