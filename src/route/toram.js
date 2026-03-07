import express from "express";
import { searchItem } from "../controllers/toram/item.js";
import { searchAbility } from "../controllers/toram/ability.js";
import { searchXtal } from "../controllers/toram/xtall.js";
import { searchRegis } from "../controllers/toram/regis.js";
import { searchApp } from "../controllers/toram/appview.js";
import { Banner } from "../controllers/config/avacon.js";
import { spamadv } from "../controllers/toram/spamadv.js";
import { dye } from "../controllers/toram/dye.js";

const toram = express.Router();

toram.get("/item", searchItem);
toram.get("/ability", searchAbility);
toram.get("/xtal", searchXtal);
toram.get("/regis", searchRegis);
toram.get("/appview", searchApp);
toram.get("/ava", Banner);
toram.get("/dye", dye);
toram.get("/spamadv", spamadv);
export default toram;
