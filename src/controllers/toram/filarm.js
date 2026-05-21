import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://tanaka0.work/id/BouguProper";
const DEFAULT_LEVEL = 320;
const DEFAULT_POTENTIAL = 110;

// ─── STAT MAP ─────────────────────────────────────────────────────────────────
// Semua stat diambil langsung dari referensi tanaka0.work/id/BouguProper
const statMap = {
  // ── Critical ──
  critdmg:       "Critical Damage",
  cd:            "Critical Damage",
  "critdmg%":   "Critical Damage %",
  "cd%":         "Critical Damage %",
  critrate:      "Critical Rate",
  cr:            "Critical Rate",
  "critrate%":  "Critical Rate %",
  "cr%":         "Critical Rate %",

  // ── Attack ──
  atk:           "ATK",
  "atk%":        "ATK %",
  matk:          "MATK",
  "matk%":       "MATK %",
  stab:          "Stability %",
  "stab%":       "Stability %",
  penfis:        "Penetrasi Fisik %",
  "penfis%":     "Penetrasi Fisik %",
  "pp%":         "Penetrasi Fisik %",
  penmag:        "Magic Pierce %",
  "penmag%":     "Magic Pierce %",
  "mp%":         "Magic Pierce %",

  // ── Speed ──
  aspd:          "Kecepatan Serangan",
  "aspd%":       "Kecepatan Serangan %",
  cspd:          "Kecepatan Merapal",
  "cspd%":       "Kecepatan Merapal %",

  // ── Base Stats ──
  str:           "STR",
  "str%":        "STR %",
  int:           "INT",
  "int%":        "INT %",
  vit:           "VIT",
  "vit%":        "VIT %",
  agi:           "AGI",
  "agi%":        "AGI %",
  dex:           "DEX",
  "dex%":        "DEX %",

  // ── HP/MP ──
  hpreg:         "Natural HP Regen",
  "hpreg%":      "Natural HP Regen %",
  mpreg:         "Natural MP Regen",
  "mpreg%":      "Natural MP Regen %",
  hp:            "MaxHP",
  "hp%":         "MaxHP %",
  maxmp:         "MaxMP",

  // ── Defense ──
  def:           "DEF",
  "def%":        "DEF %",
  mdef:          "MDEF",
  "mdef%":       "MDEF %",
  kebalfis:      "Kekebalan Fisik %",
  "kebalfis%":   "Kekebalan Fisik %",
  kebalmag:      "Kekebalan Sihir %",
  "kebalmag%":   "Kekebalan Sihir %",

  // ── Reduce Dmg (dari referensi) ──
  rdfoe:         "% Reduce Dmg (Foe Epicenter)",
  rdfoeepi:      "% Reduce Dmg (Foe Epicenter)",
  rdplayer:      "% Reduce Dmg (Player Epicenter)",
  rdplayerepi:   "% Reduce Dmg (Player Epicenter)",
  rdline:        "% Reduce Dmg (Straight Line)",
  rdstraight:    "% Reduce Dmg (Straight Line)",
  rdcharge:      "% Reduce Dmg (Charge)",
  rdmeteor:      "% Reduce Dmg (Meteor)",
  rdbullet:      "% Reduce Dmg (Bullet)",
  rdbowling:     "% Reduce Dmg (Bowling)",
  rdfloor:       "% Reduce Dmg (Floor)",

  // ── Accuracy / Dodge ──
  acc:           "Accuracy",
  accuracy:      "Accuracy",
  "acc%":        "Accuracy %",
  "accuracy%":   "Accuracy %",
  dodge:         "Dodge",
  "dodge%":      "Dodge %",

  // ── Damage to Element (DTE) ──
  dteearth:      "% luka ke Bumi",
  "dteearth%":   "% luka ke Bumi",
  dtefire:       "% luka ke Api",
  "dtefire%":    "% luka ke Api",
  dtewind:       "% luka ke Angin",
  "dtewind%":    "% luka ke Angin",
  dtewater:      "% luka ke Air",
  "dtewater%":   "% luka ke Air",
  dtelight:      "% luka ke Cahaya",
  "dtelight%":   "% luka ke Cahaya",
  dtedark:       "% luka ke Gelap",
  "dtedark%":    "% luka ke Gelap",
  // shorthand dte% → random elemen
  "dte%": [
    "% luka ke Bumi",
    "% luka ke Api",
    "% luka ke Angin",
    "% luka ke Air",
    "% luka ke Cahaya",
    "% luka ke Gelap",
  ],

  // ── Element Resist / Kebal (dari referensi) ──
  kebalapi:      "kebal Api %",
  "kebalapi%":   "kebal Api %",
  resistfire:    "kebal Api %",
  kebalair:      "kebal Air %",
  "kebalair%":   "kebal Air %",
  resistwater:   "kebal Air %",
  kebalangin:    "kebal Angin %",
  "kebalangin%": "kebal Angin %",
  resistwind:    "kebal Angin %",
  kebalbumi:     "kebal Bumi %",
  "kebalbumi%":  "kebal Bumi %",
  resistearth:   "kebal Bumi %",
  kebalcahaya:   "kebal Cahaya %",
  "kebalcahaya%":"kebal Cahaya %",
  resistlight:   "kebal Cahaya %",
  kebalgelap:    "kebal Gelap %",
  "kebalgelap%": "kebal Gelap %",
  resistdark:    "kebal Gelap %",

  // ── Special Enhancement (dari referensi) ──
  resistburuk:    "Resistensi Status Buruk %",
  "resistburuk%": "Resistensi Status Buruk %",
  sb:             "Resistensi Status Buruk %",
  "sb%":          "Resistensi Status Buruk %",
  guardpow:       "Guard Power %",
  "guardpow%":    "Guard Power %",
  gp:             "Guard Power %",
  "gp%":          "Guard Power %",
  guardrate:      "Guard Rate %",
  "guardrate%":   "Guard Rate %",
  gr:             "Guard Rate %",
  "gr%":          "Guard Rate %",
  evasion:        "Evasion Rate %",
  "evasion%":     "Evasion Rate %",
  er:             "Evasion Rate %",
  "er%":          "Evasion Rate %",
  aggro:          "Aggro %",
  "aggro%":       "Aggro %",
};

// ─── STAT MAX LEVEL (dikoreksi & dilengkapi dari referensi HTML tanaka) ──────
const statMaxLevel = {
  // Critical
  "Critical Rate":                     32,
  "Critical Rate %":                   32,
  "Critical Damage":                   24,
  "Critical Damage %":                 12,
  // Attack
  "ATK":                               32,
  "ATK %":                             16,
  "MATK":                              32,
  "MATK %":                            16,
  "Stability %":                        7,
  "Penetrasi Fisik %":                  9,
  "Magic Pierce %":                     9,
  // Speed
  "Kecepatan Serangan":                32,
  "Kecepatan Serangan %":              22,
  "Kecepatan Merapal":                 32,
  "Kecepatan Merapal %":               22,
  // Base Stats
  "STR":                               32,
  "STR %":                             10,
  "INT":                               32,
  "INT %":                             10,
  "VIT":                               32,
  "VIT %":                             10,
  "AGI":                               32,
  "AGI %":                             10,
  "DEX":                               32,
  "DEX %":                             10,
  // HP/MP  ← MaxLv diperbaiki sesuai referensi
  "Natural HP Regen":                  32,
  "Natural HP Regen %":                10,  // FIX: referensi MaxLv:10
  "Natural MP Regen":                  16,
  "Natural MP Regen %":                 5,
  "MaxHP":                             32,  // FIX: referensi MaxLv:32
  "MaxHP %":                           14,
  "MaxMP":                             21,  // FIX: referensi MaxLv:21
  // Defense  ← MaxLv diperbaiki sesuai referensi
  "DEF":                               32,  // FIX: referensi MaxLv:32
  "DEF %":                             14,
  "MDEF":                              32,  // FIX: referensi MaxLv:32
  "MDEF %":                            14,
  "Kekebalan Fisik %":                 14,
  "Kekebalan Sihir %":                 14,
  // Reduce Dmg  ← BARU dari referensi
  "% Reduce Dmg (Foe Epicenter)":      12,
  "% Reduce Dmg (Player Epicenter)":   12,
  "% Reduce Dmg (Straight Line)":      12,
  "% Reduce Dmg (Charge)":             12,
  "% Reduce Dmg (Meteor)":             12,
  "% Reduce Dmg (Bullet)":             12,
  "% Reduce Dmg (Bowling)":            12,
  "% Reduce Dmg (Floor)":              12,
  // Accuracy / Dodge  ← MaxLv diperbaiki sesuai referensi
  "Accuracy":                          18,  // FIX: referensi MaxLv:18
  "Accuracy %":                         7,
  "Dodge":                             18,  // FIX: referensi MaxLv:18
  "Dodge %":                            7,
  // DTE
  "% luka ke Api":                     24,
  "% luka ke Air":                     24,
  "% luka ke Angin":                   24,
  "% luka ke Bumi":                    24,
  "% luka ke Cahaya":                  24,
  "% luka ke Gelap":                   24,
  // Element Resist  ← BARU dari referensi
  "kebal Api %":                       28,
  "kebal Air %":                       28,
  "kebal Angin %":                     28,
  "kebal Bumi %":                      28,
  "kebal Cahaya %":                    28,
  "kebal Gelap %":                     28,
  // Special  ← BARU dari referensi
  "Resistensi Status Buruk %":          7,
  "Guard Power %":                      7,
  "Guard Rate %":                       7,
  "Evasion Rate %":                     7,
  "Aggro %":                           21,
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
    compassion: {
      metal:    10,
      cloth:    10,
      beast:    10,
      wood:     10,
      medicine: 10,
      mana:     10,
    },
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
  if (profM) config.professionLevel = Math.min(400, Math.max(0, +profM[1]));

  for (const part of input.split(",").map((s) => s.trim())) {
    if (!part || /^(lv|pot|rpot|prof|bs|alchemist)\d*/.test(part)) continue;

    const m = part.match(/^([a-z%]+)\s*=\s*(.+)$/);
    if (!m) continue;

    let fullName = statMap[m[1]];
    if (!fullName) continue;

    // Jika dte% (array), random salah satu elemen
    if (Array.isArray(fullName)) {
      const key = Math.floor(Math.random() * fullName.length);
      fullName = fullName[key];
    }

    const isMin = m[2] === "min";
    const isMax = m[2] === "max";
    const maxLv = statMaxLevel[fullName] ?? 32;

    let level;
    if (isMax)      level = "MAX";
    else if (isMin) level = String(maxLv);
    else            level = String(Math.min(maxLv, Math.max(0, parseInt(m[2], 10) || 0)));

    if (isMin) {
      if (config.negativeStats.length < 7)
        config.negativeStats.push({ name: fullName, level: "MAX" });
    } else {
      if (config.positiveStats.length < 7)
        config.positiveStats.push({ name: fullName, level });
    }
  }

  return config;
}

// ─── SHARED AXIOS INSTANCE WITH COOKIE JAR ───────────────────────────────────
function makeClient() {
  const cookieJar = {};
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 25000,
    maxRedirects: 5,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
    },
  });

  client.interceptors.response.use((res) => {
    const setCookie = res.headers["set-cookie"];
    if (setCookie) {
      for (const c of [].concat(setCookie)) {
        const [pair] = c.split(";");
        const [k, v] = pair.split("=");
        if (k && v !== undefined) cookieJar[k.trim()] = v.trim();
      }
    }
    return res;
  });

  client.interceptors.request.use((cfg) => {
    const cookies = Object.entries(cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    if (cookies) cfg.headers["Cookie"] = cookies;
    return cfg;
  });

  return client;
}

// ─── BUILD FORM PAYLOAD ───────────────────────────────────────────────────────
// PENTING: Tanaka butuh bracket literal [0] bukan %5B0%5D
// Jadi kita build string query manual, bukan pakai URLSearchParams
function encodeField(key, value) {
  // Encode value tapi biarkan key apa adanya (bracket tidak di-encode)
  return key + "=" + encodeURIComponent(value);
}

function buildPayload($, statConfig) {
  const parts = [];

  parts.push(encodeField("properBui", "Armor"));
  parts.push(encodeField("csrf_token", $("input[name='csrf_token']").val() || ""));
  parts.push(encodeField("send_token", $("input[name='send_token']").val() || ""));

  parts.push(encodeField("paramLevel", String(statConfig.characterLevel)));
  parts.push(encodeField("shokiSenzai", String(statConfig.startingPotential)));
  parts.push(encodeField("kisoSenzai", String(statConfig.recipePotential)));

  const profLvl = Math.round(statConfig.professionLevel / 10) * 10;
  parts.push(encodeField("jukurendo", String(Math.min(400, Math.max(0, profLvl)))));

  parts.push(encodeField("rikaiKinzoku", String(statConfig.compassion.metal)));
  parts.push(encodeField("rikaiNunoti",  String(statConfig.compassion.cloth)));
  parts.push(encodeField("rikaiKemono",  String(statConfig.compassion.beast)));
  parts.push(encodeField("rikaiMokuzai", String(statConfig.compassion.wood)));
  parts.push(encodeField("rikaiYakuhin", String(statConfig.compassion.medicine)));
  parts.push(encodeField("rikaiMaso",    String(statConfig.compassion.mana)));

  for (let i = 0; i < 7; i++) {
    const stat = statConfig.positiveStats[i];
    parts.push(encodeField(`plusProperList[${i}].properName`,    stat ? stat.name  : ""));
    parts.push(encodeField(`plusProperList[${i}].properLvHyoji`, stat ? stat.level : "0"));
  }

  for (let i = 0; i < 7; i++) {
    const stat = statConfig.negativeStats[i];
    parts.push(encodeField(`minusProperList[${i}].properName`,    stat ? stat.name  : ""));
    parts.push(encodeField(`minusProperList[${i}].properLvHyoji`, stat ? stat.level : "0"));
  }

  parts.push(encodeField("sendData", "Submit"));

  return {
    toString() { return parts.join("&"); }
  };
}

// ─── PARSE HTML RESULT ────────────────────────────────────────────────────────
function parseHtmlResult(html) {
  const $ = cheerio.load(html);
  const text = $("body").text();

  const m = (p) => {
    const r = text.match(p);
    return r ? r[1] : null;
  };

  // Format asli Tanaka: "Success Rate:36%" — tanpa spasi sebelum titik dua
  const srRaw = m(/Success\s*Rate\s*[：:]\s*(\d+(?:[.,]\d+)?)\s*%/i);
  const successRateValue = srRaw !== null ? parseFloat(srRaw.replace(",", ".")) : null;

  // Format: "Starting Pot：65pt" — menggunakan titik dua fullwidth Jepang
  const startingPot = m(/Starting\s*Pot\s*[：:]\s*(\d+)\s*pt/i);

  // Format step di Tanaka: "1. Berikan ... （Sisa Pot：5pt)" 
  // — nomor diikuti titik, lanjut teks, tutup dengan kurung fullwidth Jepang ）
  // Ambil seluruh baris yang dimulai dengan angka + titik
  const steps = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => /^\d+\.\s+\S/.test(l) && l.length > 5);

  const mats = {};
  ["Metal", "Cloth", "Beast", "Wood", "Medicine", "Mana"].forEach((mat) => {
    // Format: "Metal:0pt" atau "Cloth:7,272pt"
    const r = text.match(
      new RegExp(`${mat}[：:]\\s*([\\d.,]+)\\s*pt`, "i")
    );
    if (r && r[1] !== "0") mats[mat.toLowerCase()] = r[1];
  });

  const materialCost =
    Object.entries(mats)
      .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}:${v}pt`)
      .join(", ") || null;

  // Format: "Highest mats per step: 72.534 pt" — titik sebagai pemisah ribuan
  const highestM = m(/Highest\s+mats?\s+per\s+step\s*[：:]\s*([\d.,]+)\s*pt/i);

  // Format: "(30% reduction by PROF LV)" atau "(40% reduction by Anvils)"
  const redMatches = [...text.matchAll(/\((\d+%)\s*reduction\s*by\s*([^)]+)\)/gi)];
  const reductions = redMatches.map(r => `${r[1]} by ${r[2].trim()}`);

  return {
    hasValidResult: successRateValue !== null && steps.length > 0,
    successRateValue,
    successRate: successRateValue !== null ? `${successRateValue}%` : null,
    startingPot: startingPot ? `${startingPot}pt` : null,
    steps,
    totalSteps: steps.length,
    materialCost,
    materialDetails: {
      ...mats,
      ...(reductions.length ? { reductions } : {}),
    },
    highestStepCost: highestM ? `${highestM}pt` : null,
    timestamp: new Date().toISOString(),
  };
}

// ─── MAIN SCRAPE ──────────────────────────────────────────────────────────────
async function scrape(statConfig) {
  const client = makeClient();

  // Step 1: GET untuk ambil halaman + set cookie session
  const getResp = await client.get(BASE_URL, {
    headers: { Referer: "https://tanaka0.work/id/" },
  });
  const $get = cheerio.load(getResp.data);

  // Step 2: POST pertama dengan paramLevel saja (Reload) untuk mendapat
  // csrf_token dan send_token yang valid dari server
  const initPayload = [
    "properBui=Armor",
    "paramLevel=" + encodeURIComponent(String(statConfig.characterLevel)),
    "lebelUpdate=Submit",
  ].join("&");

  const initResp = await client.post(BASE_URL, initPayload, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: BASE_URL,
      Origin: "https://tanaka0.work",
    },
  });

  const $init = cheerio.load(initResp.data);
  const csrfToken = $init("input[name='csrf_token']").val() || "";
  const sendToken = $init("input[name='send_token']").val() || "";

  // Step 3: POST utama dengan semua stat + token yang valid
  const payload = buildPayload($init, statConfig);

  const postResp = await client.post(BASE_URL, payload.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: BASE_URL,
      Origin: "https://tanaka0.work",
    },
  });

  const rawHtml = postResp.data;
  return parseHtmlResult(rawHtml);
}

// ─── VERCEL HANDLER ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { text } = req.query;

  if (!text) {
    return res.status(200).json({
      ok: true,
      service: "Toram Filarm API",
      endpoint: "GET /api/toram/filarm?text=<command>",
      syntax: "stat=level, lv<num>, pot<num>, bs<num>",
      levels: "max (positive) | min (negative) | number",
      params: {
        lv:   "Character level (200-350)",
        pot:  "Starting potential (1-180)",
        rpot: "Recipe potential (1-180)",
        bs:   "Blacksmith profession level (0-400, multiples of 10)",
      },
      examples: [
        "cd=max,acc=min,lv280,pot110",
        "atk%=max,cr=max,def%=min,lv300,pot120,bs300",
        "matk%=max,int%=max,cspd%=max,lv310,pot110",
        "kebalapi=max,kebalair=max,resistburuk=max,lv320,pot110",
        "guardpow=max,guardrate=max,evasion=max,lv300,pot100",
        "rdcharge=max,rdmeteor=max,def%=max,lv320,pot110",
      ],
      availableStats: {
        critical:   ["critdmg/cd", "critdmg%/cd%", "critrate/cr", "critrate%/cr%"],
        attack:     ["atk", "atk%", "matk", "matk%", "stab/stab%", "penfis/pp%", "penmag/mp%"],
        speed:      ["aspd", "aspd%", "cspd", "cspd%"],
        baseStats:  ["str","str%","int","int%","vit","vit%","agi","agi%","dex","dex%"],
        hpMp:       ["hp","hp%","maxmp","hpreg","hpreg%","mpreg","mpreg%"],
        defense:    ["def","def%","mdef","mdef%","kebalfis/kebalfis%","kebalmag/kebalmag%"],
        reduceDmg:  ["rdfoe","rdplayer","rdline","rdcharge","rdmeteor","rdbullet","rdbowling","rdfloor"],
        accuracy:   ["acc/accuracy","acc%/accuracy%","dodge","dodge%"],
        dteLuka:    ["dtefire","dtewater","dtewind","dteearth","dtelight","dtedark","dte%"],
        elemResist: ["kebalapi","kebalair","kebalangin","kebalbumi","kebalcahaya","kebalgelap"],
        special:    ["resistburuk/sb%","guardpow/gp%","guardrate/gr%","evasion/er%","aggro/aggro%"],
      },
    });
  }

  const start = Date.now();
  try {
    const statConfig = parseCommand(text);
    if (!statConfig.positiveStats.length && !statConfig.negativeStats.length) {
      return res.status(400).json({
        ok: false,
        error: "Tidak ada stat yang valid ditemukan.",
        availableKeys: Object.keys(statMap),
      });
    }

    const result = await scrape(statConfig);
    result.duration = Date.now() - start;
    result.inputConfig = statConfig;

    if (!result.hasValidResult) {
      result._note =
        "Hasil tidak ditemukan dalam response. Form mungkin memiliki validation error atau server menolak request.";
    }

    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    const status = err.response?.status;
    return res.status(500).json({
      ok: false,
      error: err.message,
      httpStatus: status || null,
      duration: Date.now() - start,
    });
  }
}
