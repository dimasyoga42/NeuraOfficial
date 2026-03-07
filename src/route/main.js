import express from "express";
import { waifuGhaca } from "../controllers/fun/waifu.js";
import limiter from "../midlware/limiter.js";
import { kerangAjaib } from "../controllers/fun/kerang.js";
import { Anime } from "../controllers/fun/anime.js";
import { khodam } from "../controllers/fun/khodam.js";

const main = express.Router();

main.get("/waifu", limiter, waifuGhaca);
main.get("/kerang", limiter, kerangAjaib);
main.get("/anime", Anime);
main.get("/khodam", khodam);
export default main;
