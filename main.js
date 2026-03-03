import express from "express";
import dotenv from "dotenv";
import { struckRes } from "./src/utility/struck.js";
import main from "./src/route/main.js";
dotenv.config();

const Port = process.env.PORT || 3000;
const app = express();
app.use("/api", main);
app.listen(Port, () => {
  console.log("server is run");
});
