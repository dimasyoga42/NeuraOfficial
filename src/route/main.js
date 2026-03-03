import express from "express";
import { waifuGhaca } from "../controllers/waifu.js";

const main = express.Router();

main.get("/waifu", waifuGhaca);
export default main;
