import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://tanaka0.work/id/BouguProper";
const DEFAULT_LEVEL = 320;
const DEFAULT_POTENTIAL = 110;

// ─── STAT MAP ─────────────────────────────────────────────────────────────────
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
  maxmp: "MaxMP",
  "maxmp%": "MaxMP %",
  "mp%": "Magic Pierce %",
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
  "pp%": "Penetrasi Fisik %",
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
};

// ─── STAT MAX LEVEL ───────────────────────────────────────────────────────────
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
  "Kecepatan Serangan": 31,
  "Kecepatan Serangan %": 22,
  "Kecepatan Merapal": 31,
  "Kecepatan Merapal %": 22,
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
  "Natural HP Regen": 32,
  "Natural HP Regen %": 14,
  "Natural MP Regen": 16,
  "Natural MP Regen %": 5,
  MaxHP: 31,
  "MaxHP %": 14,
  MaxMP: 20,
  DEF: 31,
  "DEF %": 14,
  MDEF: 31,
  "MDEF %": 14,
  "Kekebalan Fisik %": 14,
  "Kekebalan Sihir %": 14,
  Accuracy: 26,
  "Accuracy %": 7,
  Dodge: 17,
  "Dodge %": 7,
  "Aggro %": 21,
  "% luka ke Api": 23,
  "% luka ke Air": 23,
  "% luka ke Angin": 23,
  "% luka ke Bumi": 23,
  "% luka ke Cahaya": 23,
  "% luka ke Gelap": 23,
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
      metal: 10,
      cloth: 10,
      beast: 10,
      wood: 10,
      medicine: 10,
      mana: 10,
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
    /(?:prof\s*[:=]?\s*(?:bs\s*[:=]?\s*)?|bs\s*[:=]?\s*)(\d+)/i,
  );
  if (profM) config.professionLevel = Math.min(400, Math.max(0, +profM[1]));

  for (const part of input.split(",").map((s) => s.trim())) {
    if (!part || /^(lv|pot|rpot|prof|bs|alchemist)\d*/.test(part)) continue;

    const m = part.match(/^([a-z%]+)\s*=\s*(.+)$/);
    if (!m) continue;

    let fullName = statMap[m[1]];
    if (!fullName) continue;

    // ✅ Jika dte% (array), random salah satu elemen
    if (Array.isArray(fullName)) {
      const key = Math.floor(Math.random() * fullName.length);
      fullName = fullName[key];
    }

    const isMin = m[2] === "min";
    const isMax = m[2] === "max";
    const maxLv = statMaxLevel[fullName] || 31;

    let level;
    if (isMin) level = String(maxLv);
    else if (isMax) level = "MAX";
    else level = String(Math.min(maxLv, Math.max(0, parseInt(m[2], 10) || 0)));

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
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
function buildPayload($, statConfig) {
  const params = new URLSearchParams();

  params.append("properBui", "Armor");
  params.append("csrf_token", $("input[name='csrf_token']").val() || "");
  params.append("send_token", $("input[name='send_token']").val() || "");

  params.append("paramLevel", String(statConfig.characterLevel));
  params.append("shokiSenzai", String(statConfig.startingPotential));
  params.append("kisoSenzai", String(statConfig.recipePotential));

  const profLvl = Math.round(statConfig.professionLevel / 10) * 10;
  params.append("jukurendo", String(Math.min(400, Math.max(0, profLvl))));

  params.append("rikaiKinzoku", String(statConfig.compassion.metal));
  params.append("rikaiNunoti", String(statConfig.compassion.cloth));
  params.append("rikaiKemono", String(statConfig.compassion.beast));
  params.append("rikaiMokuzai", String(statConfig.compassion.wood));
  params.append("rikaiYakuhin", String(statConfig.compassion.medicine));
  params.append("rikaiMaso", String(statConfig.compassion.mana));

  for (let i = 0; i < 7; i++) {
    const stat = statConfig.positiveStats[i];
    params.append(`plusProperList[${i}].properName`, stat ? stat.name : "");
    params.append(
      `plusProperList[${i}].properLvHyoji`,
      stat ? stat.level : "0",
    );
  }

  for (let i = 0; i < 7; i++) {
    const stat = statConfig.negativeStats[i];
    params.append(`minusProperList[${i}].properName`, stat ? stat.name : "");
    params.append(
      `minusProperList[${i}].properLvHyoji`,
      stat ? stat.level : "0",
    );
  }

  params.append("sendData", "Submit");
  return params;
}

// ─── PARSE HTML RESULT ────────────────────────────────────────────────────────
function parseHtmlResult(html) {
  const $ = cheerio.load(html);
  const text = $("body").text();

  const m = (p) => {
    const r = text.match(p);
    return r ? r[1] : null;
  };

  const srRaw = m(/Success\s+Rate\s*[：:]\s*(\d+(?:\.\d+)?)\s*%/i);
  const successRateValue = srRaw !== null ? parseFloat(srRaw) : null;

  const startingPot = m(/Starting\s+Pot[：:]\s*(\d+)\s*pt/i);

  const steps = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+\.\s/.test(l));

  const mats = {};
  ["Metal", "Cloth", "Beast", "Wood", "Medicine", "Mana"].forEach((mat) => {
    const r = text.match(
      new RegExp(`${mat}[：:]\\s*(\\d+(?:,\\d+)*)\\s*pt`, "i"),
    );
    if (r && r[1] !== "0") mats[mat.toLowerCase()] = r[1];
  });

  const materialCost =
    Object.entries(mats)
      .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}:${v}pt`)
      .join(", ") || null;

  const highestM = m(
    /Highest\s+mats?\s+per\s+step[：:]\s*([\d,]+(?:\.\d+)?)\s*pt/i,
  );
  const redM = text.match(/\((\d+%)\s*reduction\s*by\s*(\w[^)]+)\)/i);

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
      ...(redM ? { reduction: `${redM[1]} by ${redM[2].trim()}` } : {}),
    },
    highestStepCost: highestM ? `${highestM}pt` : null,
    timestamp: new Date().toISOString(),
  };
}

// ─── MAIN SCRAPE ──────────────────────────────────────────────────────────────
async function scrape(statConfig) {
  const client = makeClient();

  const getResp = await client.get(BASE_URL, {
    headers: { Referer: "https://tanaka0.work/id/" },
  });
  const $ = cheerio.load(getResp.data);

  const payload = buildPayload($, statConfig);

  const postResp = await client.post(BASE_URL, payload.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: BASE_URL,
      Origin: "https://tanaka0.work",
    },
  });

  return parseHtmlResult(postResp.data);
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
        lv: "Character level (200-350)",
        pot: "Starting potential (1-180)",
        rpot: "Recipe potential (1-180)",
        bs: "Blacksmith profession level (0-400, multiples of 10)",
      },
      examples: [
        "cd=max,acc=min,lv280,pot110",
        "atk%=max,cr=max,def%=min,lv300,pot120,bs300",
        "matk%=max,int%=max,cspd%=max,lv310,pot110",
      ],
      availableStats: statMap,
    });
  }

  const start = Date.now();
  try {
    const statConfig = parseCommand(text);
    if (!statConfig.positiveStats.length && !statConfig.negativeStats.length) {
      return res.status(400).json({
        ok: false,
        error: "No valid stats found.",
        availableKeys: Object.keys(statMap),
      });
    }

    const result = await scrape(statConfig);
    result.duration = Date.now() - start;
    result.inputConfig = statConfig;

    if (!result.hasValidResult) {
      result._note =
        "Result not found in response. The form may have validation errors or the server rejected the request.";
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
