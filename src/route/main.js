import express from "express";
import { waifuGhaca } from "../controllers/fun/waifu.js";
import limiter from "../midlware/limiter.js";

const main = express.Router();

main.get("/waifu", limiter, waifuGhaca);
export default main;
