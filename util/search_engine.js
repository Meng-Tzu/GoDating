// 設定模組
import dotenv from "dotenv";
dotenv.config();
import { Client } from "@elastic/elasticsearch";

// ElasticSearch Client
const client = new Client({
  node: `http://${process.env.ELASTICSEARCH_HOST}:${process.env.ELASTICSEARCH_PORT}`,
});

export { client };
