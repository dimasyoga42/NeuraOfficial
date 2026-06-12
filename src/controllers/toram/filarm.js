import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://tanaka0.work/id/BouguProper";
const DEFAULT_LEVEL = 320;
const DEFAULT_POTENTIAL = 110;

// ─── STAT MAP ─────────────────────────────────────────────────────────────────
const statMap = {
  // Critical
  critdmg: "Critical Damage",
  cd: "Critical Damage",
  "critdmg%": "Critical Damage %",
  "cd%": "Critical Damage %",
  critrate: "Critical Rate",
  cr: "Critical Rate",
  "critrate%": "Critical Rate %",
  "cr%": "Critical Rate %",

  // Attack
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

  // Speed
  aspd: "Kecepatan Serangan",
  "aspd%": "Kecepatan Serangan %",
  cspd: "Kecepatan Merapal",
  "cspd%": "Kecepatan Merapal %",

  // Base Stats
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

  // HP/MP
  hpreg: "Natural HP Regen",
  "hpreg%": "Natural HP Regen %",
  mpreg: "Natural MP Regen",
  "mpreg%": "Natural MP Regen %",
  hp: "MaxHP",
  "hp%": "MaxHP %",
  maxmp: "MaxMP",

  // Defense
  def: "DEF",
  "def%": "DEF %",
  mdef: "MDEF",
  "mdef%": "MDEF %",
  kebalfis: "Kekebalan Fisik %",
  "kebalfis%": "Kekebalan Fisik %",
  kebalmag: "Kekebalan Sihir %",
  "kebalmag%": "Kekebalan Sihir %",

  // Reduce Damage
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

  // Accuracy
  acc: "Accuracy",
  accuracy: "Accuracy",
  "acc%": "Accuracy %",
  "accuracy%": "Accuracy %",
  dodge: "Dodge",
  "dodge%": "Dodge %",

  // DTE
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

  // Element Resist
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

  // Special
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

// ─── MAX LEVEL ────────────────────────────────────────────────────────────────
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

// ─── PARSE COMMAND ────────────────────────────────────────────────────────────
function parseCommand(text) {
  const config = {
    positiveStats: [],
    negativeStats: [],
    characterLevel: DEFAULT_LEVEL,
    startingPotential: DEFAULT_POTENTIAL,
    recipePotential: 15,
    professionLevel: 0,
  };

  const input = text.toLowerCase().trim();

  const lvM = input.match(/(?:^|,)\s*lv\s*=\s*(\d+)/i);
  if (lvM) {
    config.characterLevel = Math.min(350, Math.max(200, Number(lvM[1])));
  }

  const potM = input.match(/(?:^|,)\s*pot\s*=\s*(\d+)/i);
  if (potM) {
    config.startingPotential = Math.min(180, Math.max(1, Number(potM[1])));
  }

  const rpotM = input.match(/(?:^|,)\s*rpot\s*=\s*(\d+)/i);
  if (rpotM) {
    config.recipePotential = Math.min(180, Math.max(1, Number(rpotM[1])));
  }

  const profM = input.match(/(?:^|,)\s*(?:prof|bs)\s*=\s*(\d+)/i);
  if (profM) {
    config.professionLevel = Math.min(400, Math.max(0, Number(profM[1])));
  }

  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (/^(lv|pot|rpot|prof|bs)\s*=/.test(part)) {
      continue;
    }

    const match = part.match(/^([a-z0-9%]+)\s*=\s*(max|min|\d+)$/i);
    if (!match) continue;

    const key = match[1].toLowerCase();
    const value = match[2].toLowerCase();

    let fullName = statMap[key];
    if (!fullName) continue;

    if (Array.isArray(fullName)) {
      const index = Math.floor(Math.random() * fullName.length);
      fullName = fullName[index];
    }

    const maxLv = statMaxLevel[fullName] ?? 32;

    let level = "0";
    if (value === "max" || value === "min") {
      level = "MAX";
    } else {
      level = String(Math.min(maxLv, Math.max(0, Number(value))));
    }

    if (value === "min") {
      if (config.negativeStats.length >= 7) continue;
      config.negativeStats.push({ name: fullName, level: "MAX" });
      continue;
    }

    if (config.positiveStats.length >= 7) continue;
    config.positiveStats.push({ name: fullName, level });
  }

  return config;
}

// ─── AXIOS ────────────────────────────────────────────────────────────────────
function makeClient() {
  return axios.create({
    timeout: 30000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Referer: BASE_URL,
      Origin: "https://tanaka0.work",
    },
  });
}

// ─── BUILD PAYLOAD ────────────────────────────────────────────────────────────
function encodeField(key, value) {
  return `${key}=${encodeURIComponent(value)}`;
}

function buildPayload(statConfig) {
  const parts = [];

  parts.push(encodeField("properBui", "Armor"));
  parts.push(encodeField("paramLevel", statConfig.characterLevel));
  parts.push(encodeField("shokiSenzai", statConfig.startingPotential));
  parts.push(encodeField("kisoSenzai", statConfig.recipePotential));
  parts.push(encodeField("jukurendo", statConfig.professionLevel));

  for (let i = 0; i < 7; i++) {
    const stat = statConfig.positiveStats[i];
    parts.push(encodeField(`plusProperList[${i}].properName`, stat?.name || ""));
    parts.push(encodeField(`plusProperList[${i}].properLvHyoji`, stat?.level || "0"));
  }

  for (let i = 0; i < 7; i++) {
    const stat = statConfig.negativeStats[i];
    parts.push(encodeField(`minusProperList[${i}].properName`, stat?.name || ""));
    parts.push(encodeField(`minusProperList[${i}].properLvHyoji`, stat?.level || "0"));
  }

  parts.push(encodeField("sendData", "Submit"));

  return parts.join("&");
}

// ─── PARSE RESULT ─────────────────────────────────────────────────────────────
function parseHtmlResult(html) {
  const $ = cheerio.load(html);

  // ── Success Rate ──────────────────────────────────────────────────────────
  // Format HTML: <font color="red">Success Rate:100%</font>
  // Bisa juga muncul di <span><font color="red">Success Rate:100%</font></span>
  let successRate = null;
  $("font[color='red']").each((_, el) => {
    const t = $(el).text().trim();
    const m = t.match(/Success\s*Rate\s*[：:]\s*([\d.,]+%)/i);
    if (m && !successRate) successRate = m[1];
  });

  // ── Starting Pot ──────────────────────────────────────────────────────────
  // Format HTML: Steps<b>(Starting Pot：110pt)</b>
  // Karakter separator bisa fullwidth ： atau halfwidth :
  let startingPot = null;
  $("b").each((_, el) => {
    const t = $(el).text().trim();
    const m = t.match(/Starting\s*Pot\s*[：:]\s*(-?\d+pt)/i);
    if (m && !startingPot) startingPot = m[1];
  });

  // ── Steps ─────────────────────────────────────────────────────────────────
  // Format teks: "1. Berikan ATK% Lvl.4, CD% Lvl.2 sekaligus.（Sisa Pot：10pt)"
  // Setiap step dipisahkan oleh <br><br> di dalam <div>
  // Deteksi div yang mengandung step dengan marker "Sisa Pot"
  const steps = [];

  $("div").each((_, divEl) => {
    const divText = $(divEl).text();
    if (!divText.includes("Sisa Pot")) return;

    // Ekstrak setiap step dengan nomor urut diikuti teks instruksi + pot sisa
    // Pola: angka + ". " + teks instruksi + "（Sisa Pot：Xpt)"
    // Gunakan global matchAll untuk menangkap semua step dalam satu div
    const stepRegex =
      /(\d+)\.\s+((?:(?!(?:\d+\.\s+Berikan|\d+\.\s+Give)).)*?(?:sekaligus|satu per satu)[^（）]*[（(]Sisa Pot[：:][^)）]+[)）])/gi;

    const matches = [...divText.matchAll(stepRegex)];
    if (matches.length > 0) {
      for (const m of matches) {
        const stepText = `${m[1]}. ${m[2].trim()}`;
        if (!steps.some((s) => s === stepText)) {
          steps.push(stepText);
        }
      }
      return false;
    }
  });

  // Fallback: parse menggunakan split pada <br> tags jika matchAll kosong
  if (steps.length === 0) {
    $("div").each((_, divEl) => {
      const divHtml = $(divEl).html() ?? "";
      if (!divHtml.includes("Sisa Pot")) return;

      // Split berdasarkan <br> dan cari baris yang dimulai angka + titik
      const lines = divHtml
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      for (const line of lines) {
        // Decode HTML entities sederhana
        const decoded = line
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"');

        if (/^\d+\.\s+/.test(decoded) && decoded.includes("Sisa Pot")) {
          if (!steps.some((s) => s === decoded)) {
            steps.push(decoded);
          }
        }
      }

      if (steps.length > 0) return false;
    });
  }

  // ── Materials ─────────────────────────────────────────────────────────────
  // Format: Metal:0pt,Cloth:0pt,Beast:13,714pt,Wood:36,805pt,Medicine:42,561pt,Mana:23,896pt
  // Angka menggunakan koma sebagai thousands separator, diakhiri "pt"
  // Regex khusus: nama material, lalu angka (bisa ada koma), lalu "pt"
  const materials = {};
  const materialNames = ["Metal", "Cloth", "Beast", "Wood", "Medicine", "Mana"];

  $("div").each((_, divEl) => {
    const divText = $(divEl).text();
    if (!divText.includes("Metal:") || !divText.includes("Cloth:")) return;

    for (const matName of materialNames) {
      // Pola: "Metal:" diikuti angka dengan possible koma thousands, diakhiri "pt"
      // Contoh: Metal:0pt  atau  Beast:13,714pt
      const matRegex = new RegExp(
        `${matName}[：:]([0-9](?:[0-9,]*[0-9])?)pt`,
        "i"
      );
      const mr = divText.match(matRegex);
      if (mr) {
        // Hapus koma (thousands separator) untuk mendapat angka bersih
        const cleanValue = mr[1].replace(/,/g, "");
        materials[matName.toLowerCase()] = cleanValue;
      }
    }

    return false;
  });

  // ── Highest mats per step ─────────────────────────────────────────────────
  // Format: (Highest mats per step: 42.561 pt)
  // Titik dipakai sebagai decimal/thousands separator di sini
  let highestStepCost = null;
  const bodyText = $("body").text();
  const hm = bodyText.match(
    /Highest\s*mats?\s*per\s*step\s*[：:]\s*([\d.,]+\s*pt)/i
  );
  if (hm) highestStepCost = hm[1].trim();

  return {
    successRate,
    startingPot,
    highestStepCost,
    totalSteps: steps.length,
    steps,
    materials,
    hasValidResult: !!successRate && steps.length > 0,
  };
}

// ─── SCRAPE ───────────────────────────────────────────────────────────────────
async function scrape(statConfig) {
  const client = makeClient();
  const payload = buildPayload(statConfig);

  const response = await client.post(`${BASE_URL}#output`, payload, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return parseHtmlResult(response.data);
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { text } = req.query;

  if (!text) {
    return res.status(200).json({
      ok: true,
      example: "cd=max,acc=min,lv=320,pot=110,prof=250",
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
        error: "Tidak ada stat valid.",
      });
    }

    const result = await scrape(statConfig);

    return res.status(200).json({
      ok: true,
      duration: Date.now() - start,
      inputConfig: statConfig,
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
