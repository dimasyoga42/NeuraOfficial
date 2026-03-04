import express from "express";
import { searchItem } from "../controllers/toram/item.js";
import { searchAbility } from "../controllers/toram/ability.js";
import { searchXtal } from "../controllers/toram/xtall.js";
import { searchRegis } from "../controllers/toram/regis.js";
import { searchApp } from "../controllers/toram/appview.js";
import { Banner } from "../controllers/config/avacon.js";
import { spamadv } from "../controllers/toram/spamadv.js";

const toram = express.Router();

toram.get("/item/q=:name&limit=:limit", searchItem);
toram.get("/ability/q=:name", searchAbility);
toram.get("/xtal/q=:name", searchXtal);
toram.get("/regis/q=:name", searchRegis);
toram.get("/appview/q=:name", searchApp);
toram.get("/ava", Banner);
toram.get("/spamadv/q=level=:lv&exp=:exp&max=:lvmx&from=:from", spamadv);
export default toram;
