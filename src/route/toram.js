import express from "express";
import { searchItem } from "../controllers/toram/item.js";
import { searchAbility } from "../controllers/toram/ability.js";
import { searchXtal } from "../controllers/toram/xtall.js";
import { searchRegis } from "../controllers/toram/regis.js";
import { searchApp } from "../controllers/toram/appview.js";
import { Banner } from "../controllers/config/avacon.js";

const toram = express.Router();

toram.get("/item/q=:name&limit=:limit", searchItem);
toram.get("/ability/q=:name", searchAbility);
toram.get("/xtal/q=:name", searchXtal);
toram.get("/regis/q=:name", searchRegis);
toram.get("/appview/q=:name", searchApp);
toram.get("/ava", Banner);
export default toram;
