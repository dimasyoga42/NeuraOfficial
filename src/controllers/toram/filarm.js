import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

const BASE_URL = "https://tanaka0.work/id/BouguProper";
const DEFAULT_LEVEL = 320;
const DEFAULT_POTENTIAL = 110;

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
  stab: "Stability %",
  "stab%": "Stability %",
  penfis: "Penetrasi Fisik %",
  "penfis%": "Penetrasi Fisik %",
  "pp%": "Penetrasi Fisik %",
  penmag: "Magic Pierce %",
  "penmag%": "Magic Pierce %",
  "mp%": "Magic Pierce %",

  aspd: "Kecepatan Serangan",
  "aspd%": "Kecepatan Serangan %",
  cspd: "Kecepatan Merapal",
  "cspd%": "Kecepatan Merapal %",

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

  hpreg: "Natural HP Regen",
  "hpreg%": "Natural HP Regen %",
  mpreg: "Natural MP Regen",
  "mpreg%": "Natural MP Regen %",
  hp: "MaxHP",
  "hp%": "MaxHP %",
  maxmp: "MaxMP",

  def: "DEF",
  "def%": "DEF %",
  mdef: "MDEF",
  "mdef%": "MDEF %",
  kebalfis: "Kekebalan Fisik %",
  "kebalfis%": "Kekebalan Fisik %",
  kebalmag: "Kekebalan Sihir %",
  "kebalmag%": "Kekebalan Sihir %",

  rdfoe: "% Reduce Dmg (Foe Epicenter)",
  rdfoeepi: "% Reduce Dmg (Foe Epicenter)",
  rdplayer: "% Reduce Dmg (Player Epicenter)",
  rdplayerepi: "% Reduce Dmg (Player Epicenter)",
  rdline: "% Reduce Dmg (Straight Line)",
  rdstraight: "% Reduce Dmg (Straight Line)",
  rdcharge: "% Reduce Dmg (Charge)",
  rdmeteor: "% Reduce Dmg (Meteor)",
  rdbullet: "% Reduce Dmg (Bullet)",
  rdbowling: "% Reduce Dmg (Bowling)",
  rdfloor: "% Reduce Dmg (Floor)",

  acc: "Accuracy",
  accuracy: "Accuracy",
  "acc%": "Accuracy %",
  "accuracy%": "Accuracy %",
  dodge: "Dodge",
  "dodge%": "Dodge %",

  dteearth: "% luka ke Bumi",
  "dteearth%": "% luka ke Bumi",
  dtefire: "% luka ke Api",
  "dtefire%": "% luka ke Api",
  dtewind: "% luka ke Angin",
  "dtewind%": "% luka ke Angin",
  dtewater: "% luka ke Air",
  "dtewater%": "% luka ke Air",
  dtelight: "% luka ke Cahaya",
  "dtelight%": "% luka ke Cahaya",
  dtedark: "% luka ke Gelap",
  "dtedark%": "% luka ke Gelap",
  "dte%": [
    "% luka ke Bumi",
    "% luka ke Api",
    "% luka ke Angin",
    "% luka ke Air",
    "% luka ke Cahaya",
    "% luka ke Gelap",
  ],

  kebalapi: "kebal Api %",
  "kebalapi%": "kebal Api %",
  resistfire: "kebal Api %",
  kebalair: "kebal Air %",
  "kebalair%": "kebal Air %",
  resistwater: "kebal Air %",
  kebalangin: "kebal Angin %",
  "kebalangin%": "kebal Angin %",
  resistwind: "kebal Angin %",
  kebalbumi: "kebal Bumi %",
  "kebalbumi%": "kebal Bumi %",
  resistearth: "kebal Bumi %",
  kebalcahaya: "kebal Cahaya %",
  "kebalcahaya%": "kebal Cahaya %",
  resistlight: "kebal Cahaya %",
  kebalgelap: "kebal Gelap %",
  "kebalgelap%": "kebal Gelap %",
  resistdark: "kebal Gelap %",

  resistburuk: "Resistensi Status Buruk %",
  "resistburuk%": "Resistensi Status Buruk %",
  sb: "Resistensi Status Buruk %",
  "sb%": "Resistensi Status Buruk %",
  guardpow: "Guard Power %",
  "guardpow%": "Guard Power %",
  gp: "Guard Power %",
  "gp%": "Guard Power %",
  guardrate: "Guard Rate %",
  "guardrate%": "Guard Rate %",
  gr: "Guard Rate %",
  "gr%": "Guard Rate %",
  evasion: "Evasion Rate %",
  "evasion%": "Evasion Rate %",
  er: "Evasion Rate %",
  "er%": "Evasion Rate %",
  aggro: "Aggro %",
  "aggro%": "Aggro %",
};

const statMaxLevel = {
  "Critical Rate": 32,
  "Critical Rate %": 32,
  "Critical Damage": 24,
  "Critical Damage %": 12,

  "ATK": 32,
  "ATK %": 16,
  "MATK": 32,
  "MATK %": 16,
  "Stability %": 7,
  "Penetrasi Fisik %": 9,
  "Magic Pierce %": 9,

  "Kecepatan Serangan": 32,
  "Kecepatan Serangan %": 22,
  "Kecepatan Merapal": 32,
  "Kecepatan Merapal %": 22,

  "STR": 32,
  "STR %": 10,
  "INT": 32,
  "INT %": 10,
  "VIT": 32,
  "VIT %": 10,
  "AGI": 32,
  "AGI %": 10,
  "DEX": 32,
  "DEX %": 10,

  "Natural HP Regen": 32,
  "Natural HP Regen %": 10,
  "Natural MP Regen": 16,
  "Natural MP Regen %": 5,
  "MaxHP": 32,
  "MaxHP %": 14,
  "MaxMP": 21,

  "DEF": 32,
  "DEF %": 14,
  "MDEF": 32,
  "MDEF %": 14,
  "Kekebalan Fisik %": 14,
  "Kekebalan Sihir %": 14,

  "% Reduce Dmg (Foe Epicenter)": 12,
  "% Reduce Dmg (Player Epicenter)": 12,
  "% Reduce Dmg (Straight Line)": 12,
  "% Reduce Dmg (Charge)": 12,
  "% Reduce Dmg (Meteor)": 12,
  "% Reduce Dmg (Bullet)": 12,
  "% Reduce Dmg (Bowling)": 12,
  "% Reduce Dmg (Floor)": 12,

  "Accuracy": 18,
  "Accuracy %": 7,
  "Dodge": 18,
  "Dodge %": 7,

  "% luka ke Api": 24,
  "% luka ke Air": 24,
  "% luka ke Angin": 24,
  "% luka ke Bumi": 24,
  "% luka ke Cahaya": 24,
  "% luka ke Gelap": 24,

  "kebal Api %": 28,
  "kebal Air %": 28,
  "kebal Angin %": 28,
  "kebal Bumi %": 28,
  "kebal Cahaya %": 28,
  "kebal Gelap %": 28,

  "Resistensi Status Buruk %": 7,
  "Guard Power %": 7,
  "Guard Rate %": 7,
  "Evasion Rate %": 7,
  "Aggro %": 21,
};

function parseCommand(text) {
  const config = {
    positiveStats: [],
    negativeStats: [],
    characterLevel: DEFAULT_LEVEL,
    startingPotential: DEFAULT_POTENTIAL,
    recipePotential: 15,
    professionLevel: 0,
  };

  const input = text.toLowerCase();

  const lvM = input.match(/lv(\d+)/);
  if (lvM) config.characterLevel = Math.min(350, Math.max(200, +lvM[1]));

  const potM = input.match(/pot(\d+)/);
  if (potM) config.startingPotential = Math.min(180, Math.max(1, +potM[1]));

  const rpotM = input.match(/rpot(\d+)/);
  if (rpotM) config.recipePotential = Math.min(180, Math.max(1, +rpotM[1]));

  const profM = input.match(
    /(?:prof\s*[:=]?\s*(?:bs\s*[:=]?\s*)?|bs\s*[:=]?\s*)(\d+)/i
  );

  if (profM) {
    config.professionLevel = Math.min(400, Math.max(0, +profM[1]));
  }

  for (const part of input.split(",").map((v) => v.trim())) {
    if (!part || /^(lv|pot|rpot|prof|bs)\d*/.test(part)) continue;

    const m = part.match(/^([a-z%]+)\s*=\s*(.+)$/);
    if (!m) continue;

    let fullName = statMap[m[1]];
    if (!fullName) continue;

    if (Array.isArray(fullName)) {
      fullName =
        fullName[Math.floor(Math.random() * fullName.length)];
    }

    const isMin = m[2] === "min";
    const isMax = m[2] === "max";

    const maxLv = statMaxLevel[fullName] ?? 32;

    let level;

    if (isMax) {
      level = "MAX";
    } else if (isMin) {
      level = String(maxLv);
    } else {
      level = String(
        Math.min(
          maxLv,
          Math.max(0, parseInt(m[2], 10) || 0)
        )
      );
    }

    if (isMin) {
      if (config.negativeStats.length < 7) {
        config.negativeStats.push({
          name: fullName,
          level: "MAX",
        });
      }
    } else {
      if (config.positiveStats.length < 7) {
        config.positiveStats.push({
          name: fullName,
          level,
        });
      }
    }
  }

  return config;
}

function parseHtmlResult(html) {
  const $ = cheerio.load(html);

  const text = $("body").text();

  const match = (regex) => {
    const r = text.match(regex);
    return r ? r[1] : null;
  };

  const srRaw = match(
    /Success\s*Rate\s*[：:]\s*(\d+(?:[.,]\d+)?)\s*%/i
  );

  const successRateValue =
    srRaw !== null
      ? parseFloat(srRaw.replace(",", "."))
      : null;

  const startingPot = match(
    /Starting\s*Pot\s*[：:]\s*(\d+)\s*pt/i
  );

  const steps = text
    .split(/\n/)
    .map((v) => v.trim())
    .filter((v) => /^\d+\.\s+\S/.test(v));

  const mats = {};

  for (const mat of [
    "Metal",
    "Cloth",
    "Beast",
    "Wood",
    "Medicine",
    "Mana",
  ]) {
    const r = text.match(
      new RegExp(`${mat}[：:]\\s*([\\d.,]+)\\s*pt`, "i")
    );

    if (r && r[1] !== "0") {
      mats[mat.toLowerCase()] = r[1];
    }
  }

  const highestM = match(
    /Highest\s+mats?\s+per\s+step\s*[：:]\s*([\d.,]+)\s*pt/i
  );

  return {
    hasValidResult:
      successRateValue !== null && steps.length > 0,
    successRateValue,
    successRate:
      successRateValue !== null
        ? `${successRateValue}%`
        : null,
    startingPot: startingPot
      ? `${startingPot}pt`
      : null,
    steps,
    totalSteps: steps.length,
    materialCost:
      Object.entries(mats)
        .map(
          ([k, v]) =>
            `${k[0].toUpperCase() + k.slice(1)}:${v}pt`
        )
        .join(", ") || null,
    highestStepCost: highestM
      ? `${highestM}pt`
      : null,
    timestamp: new Date().toISOString(),
  };
}

async function scrape(statConfig) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );

    await page.goto(BASE_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await page.select(
      'select[name="properBui"]',
      "Armor"
    );

    await page.evaluate((config) => {
      const setValue = (selector, value) => {
        const el = document.querySelector(selector);

        if (el) {
          el.value = value;
          el.dispatchEvent(
            new Event("change", { bubbles: true })
          );
        }
      };

      setValue(
        'input[name="paramLevel"]',
        String(config.characterLevel)
      );

      setValue(
        'input[name="shokiSenzai"]',
        String(config.startingPotential)
      );

      setValue(
        'input[name="kisoSenzai"]',
        String(config.recipePotential)
      );

      setValue(
        'select[name="jukurendo"]',
        String(
          Math.round(config.professionLevel / 10) * 10
        )
      );

      for (let i = 0; i < 7; i++) {
        const plus = config.positiveStats[i];

        setValue(
          `select[name="plusProperList[${i}].properName"]`,
          plus ? plus.name : ""
        );

        setValue(
          `select[name="plusProperList[${i}].properLvHyoji"]`,
          plus ? plus.level : "0"
        );
      }

      for (let i = 0; i < 7; i++) {
        const minus = config.negativeStats[i];

        setValue(
          `select[name="minusProperList[${i}].properName"]`,
          minus ? minus.name : ""
        );

        setValue(
          `select[name="minusProperList[${i}].properLvHyoji"]`,
          minus ? minus.level : "0"
        );
      }
    }, statConfig);

    const submitButton =
      (await page.$('input[name="sendData"]')) ||
      (await page.$('button[type="submit"]'));

    if (!submitButton) {
      throw new Error("Submit button tidak ditemukan");
    }

    await Promise.all([
      page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 60000,
      }),
      submitButton.click(),
    ]);

    const html = await page.content();

    return parseHtmlResult(html);
  } finally {
    await browser.close();
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { text } = req.query;

  if (!text) {
    return res.status(400).json({
      ok: false,
      error: "Parameter text diperlukan",
    });
  }

  const start = Date.now();

  try {
    const statConfig = parseCommand(text);

    if (
      !statConfig.positiveStats.length &&
      !statConfig.negativeStats.length
    ) {
      return res.status(400).json({
        ok: false,
        error: "Tidak ada stat valid ditemukan",
      });
    }

    const result = await scrape(statConfig);

    result.duration = Date.now() - start;
    result.inputConfig = statConfig;

    return res.status(200).json({
      ok: true,
      ...result,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
      duration: Date.now() - start,
    });
  }
}
