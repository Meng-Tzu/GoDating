import dotenv from "dotenv";
dotenv.config();
import Redis from "ioredis";

// Redis 設定
const redisClient = new Redis({
  port: process.env.CACHE_PORT,
  host: process.env.CACHE_HOST,
  username: process.env.CACHE_USER, //已經不是預設的
  password: process.env.CACHE_PASSWORD,
  db: 0, //設定連線的資料庫編號
  enableReadyCheck: false, //關掉info提醒
});

redisClient.ready = true;

redisClient.on("ready", () => {
  redisClient.ready = true;
});

redisClient.on("error", (err) => {
  redisClient.ready = false;
  if (process.env.NODE_ENV == "production") {
    console.log("Error in Redis");
  }
  console.log("redis", err);
});

redisClient.on("end", () => {
  redisClient.ready = false;
  console.log("Redis is disconnected");
});

export default redisClient;
