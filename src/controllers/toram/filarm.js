import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://tanaka0.work/id/BouguProper";
const DEFAULT_LEVEL = 320;
const DEFAULT_POTENTIAL = 110;

// ─── STAT MAP ────────────────────────────────────────────────────────────────
const statMap = {
  critdmg: "Critical Damage",
  cd: "Critical Damage",
  "critdmg%": "Critical Damage %",
  "cd%": "Critical Damage %",
  critrate: "Critical Rate",
  cr: "Critical Rate",
  "critrate%": "Critical Rate %",
  "cr%": "Critical Rate %",
  atk: "ATK",
  "atk%": "ATK %",
  matk: "MATK",
  "matk%": "MATK %",
  def: "DEF",
  "def%": "DEF %",
  mdef: "MDEF",
  "mdef%": "MDEF %",
  acc: "Accuracy",
  accuracy: "Accuracy",
  "acc%": "Accuracy %",
  "accuracy%": "Accuracy %",
  hp: "MaxHP",
  "hp%": "MaxHP %",
  mp: "MaxMP",
  "mp%": "MaxMP %",
  str: "STR",
  "str%": "STR %",
  int: "INT",
  "int%": "INT %",
  vit: "VIT",
  "vit%": "VIT %",
  agi: "AGI",
  "agi%": "AGI %",
  dex: "DEX",
  "dex%": "DEX %",
  aspd: "Kecepatan Serangan",
  "aspd%": "Kecepatan Serangan %",
  cspd: "Kecepatan Merapal",
  "cspd%": "Kecepatan Merapal %",
  dodge: "Dodge",
  "dodge%": "Dodge %",
  hpreg: "Natural HP Regen",
  "hpreg%": "Natural HP Regen %",
  mpreg: "Natural MP Regen",
  "mpreg%": "Natural MP Regen %",
  stab: "Stability %",
  "stab%": "Stability %",
  penfis: "Penetrasi Fisik %",
  "penfis%": "Penetrasi Fisik %",
  penmag: "Magic Pierce %",
  "penmag%": "Magic Pierce %",
  kebalfis: "Kekebalan Fisik %",
  "kebalfis%": "Kekebalan Fisik %",
  kebalmag: "Kekebalan Sihir %",
  "kebalmag%": "Kekebalan Sihir %",
  aggro: "Aggro %",
  "aggro%": "Aggro %",
  "dte%": [
    "% luka ke Bumi",
    "% luka ke Api",
    "% luka ke Angin",
    "% luka ke Air",
    "% luka ke Cahaya",
    "% luka ke Gelap",
  ],
  dteearth: "% luka ke Bumi",
  "dtefire%": "% luka ke Api",
  dtefire: "% luka ke Api",
  "dtewind%": "% luka ke Angin",
  dtewind: "% luka ke Angin",
  "dtewater%": "% luka ke Air",
  dtewater: "% luka ke Air",
  "dtelight%": "% luka ke Cahaya",
  dtelight: "% luka ke Cahaya",
  "dtedark%": "% luka ke Gelap",
  dtedark: "% luka ke Gelap",
};

// ─── MAX LEVEL ───────────────────────────────────────────────────────────────
const statMaxLevel = {
  "Critical Rate": 32,
  "Critical Rate %": 32,
  "Critical Damage": 24,
  "Critical Damage %": 12,
  ATK: 32,
  "ATK %": 16,
  MATK: 32,
  "MATK %": 16,
  "Stability %": 7,
  "Penetrasi Fisik %": 9,
  "Magic Pierce %": 9,
  STR: 32,
  "STR %": 10,
  INT: 32,
  "INT %": 10,
  VIT: 32,
  "VIT %": 10,
  AGI: 32,
  "AGI %": 10,
  DEX: 32,
  "DEX %": 10,
};

// ─── PARSE COMMAND ───────────────────────────────────────────────────────────
function parseCommand(text) {
  const config = {
    positiveStats: [],
    negativeStats: [],
    characterLevel: DEFAULT_LEVEL,
    startingPotential: DEFAULT_POTENTIAL,
    recipePotential: 15,
    professionLevel: 0,
    compassion: {
      metal: 10,
      cloth: 10,
      beast: 10,
      wood: 10,
      medicine: 10,
      mana: 10,
    },
  };

  const input = text.toLowerCase();

  for (const part of input.split(",").map((s) => s.trim())) {
    const m = part.match(/^([a-z%]+)\s*=\s*(.+)$/);
    if (!m) continue;

    let fullName = statMap[m[1]];
    if (!fullName) continue;

    // 🔥 RANDOM DTE%
    if (Array.isArray(fullName)) {
      fullName = fullName[Math.floor(Math.random() * fullName.length)];
    }

    const isMin = m[2] === "min";
    const isMax = m[2] === "max";
    const maxLv = statMaxLevel[fullName] || 31;

    let level;
    if (isMin) level = "MAX";
    else if (isMax) level = "MAX";
    else level = String(Math.min(maxLv, parseInt(m[2]) || 0));

    if (isMin) {
      config.negativeStats.push({ name: fullName, level });
    } else {
      config.positiveStats.push({ name: fullName, level });
    }
  }

  return config;
}

// ─── AXIOS CLIENT ────────────────────────────────────────────────────────────
function makeClient() {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 20000,
  });
}

// ─── SCRAPE ──────────────────────────────────────────────────────────────────
async function scrape(statConfig) {
  const client = makeClient();

  const getResp = await client.get(BASE_URL);
  const $ = cheerio.load(getResp.data);

  const payload = new URLSearchParams();
  payload.append("paramLevel", statConfig.characterLevel);
  payload.append("shokiSenzai", statConfig.startingPotential);

  const postResp = await client.post(BASE_URL, payload.toString());
  return cheerio.load(postResp.data)("body").text();
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const { text } = req.query;

  if (!text) {
    return res.json({
      ok: true,
      usage: "text=cd=max,dte%=max",
    });
  }

  try {
    const config = parseCommand(text);
    const result = await scrape(config);

    return res.json({
      ok: true,
      config,
      result,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}
