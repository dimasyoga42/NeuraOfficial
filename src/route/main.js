import express from "express";
import { waifuGhaca } from "../controllers/fun/waifu.js";
import limiter from "../midlware/limiter.js";
import { kerangAjaib } from "../controllers/fun/kerang.js";

const main = express.Router();

main.get("/waifu", limiter, waifuGhaca);
main.get("/kerang/q=:q", limiter, kerangAjaib);
export default main;
