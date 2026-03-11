import express from "express";
import dotenv from "dotenv";
import { struckRes } from "./src/utility/struck.js";
import main from "./src/route/main.js";
import toram from "./src/route/toram.js";
import cors from "cors";
dotenv.config();

const Port = process.env.PORT || 2120;
const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use("/api/etc", main);
app.use("/api/toram", toram);
app.listen(Port, () => {
  console.log("server is run");
});
