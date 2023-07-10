// 導入模組
import express from "express";
import dotenv from "dotenv";
dotenv.config();
const { API_VERSION } = process.env;

import connectToSocketIO from "./socketio.js";

//創建 express 的物件
const app = express();

// 取得 static file
app.use(express.static("public"));

// 可使用的 request body 格式
app.use(express.json());

// API routes
import userRouter from "./server/routes/user_route.js";
import chatRouter from "./server/routes/chat_record_route.js";
import matchRouter from "./server/routes/match_route.js";
app.use(`/api/${API_VERSION}`, [userRouter, chatRouter, matchRouter]);

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

//將 express 交給 SocketServer 開啟 SocketIO 的服務
connectToSocketIO(webSrv);
