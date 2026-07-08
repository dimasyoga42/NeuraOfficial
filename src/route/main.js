import express from "express";
import { getRandomWaifu } from "../controllers/fun/waifu.js";
import limiter from "../midlware/limiter.js";
import { kerangAjaib } from "../controllers/fun/kerang.js";
import { Anime } from "../controllers/fun/anime.js";
import { khodam } from "../controllers/fun/khodam.js";
import { wellcome } from "../controllers/fun/wellcome.js";
import { playControllers } from "../controllers/fun/ytplay.js";
import { pinterestSearch } from "../controllers/fun/pin.js";
import {
  bulkDownload,
  detailPixiv,
  proxyImage,
  searchPixiv,
} from "../controllers/fun/pixiv.js";
import {
  getScrapeStatusHandler,
  startScrapeHandler,
} from "../controllers/toram/code.js";
import { getRecentMessagesHandler } from "../controllers/toram/c.js";

const main = express.Router();

main.get("/waifu", getRandomWaifu);
main.get("/kerang", limiter, kerangAjaib);
main.get("/anime", Anime);
main.get("/khodam", khodam);
main.get("/wellcome", wellcome);
main.get("/play", playControllers);
main.get("/pin", pinterestSearch);
main.get("/pixiv/search", searchPixiv);
main.get("/pixiv/detail/:id", detailPixiv);
main.get("/pixiv/image", proxyImage);
main.post("/pixiv/download", bulkDownload);
main.get("/code/:channelId", getRecentMessagesHandler);
main.get("/sc", startScrapeHandler);
main.get("/status", getScrapeStatusHandler);
export default main;
