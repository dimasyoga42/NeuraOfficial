import axios from "axios";
import * as cheerio from "cheerio";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BASE_URL = "https://tanaka0.work/id/BouguProper";
const DEFAULT_LEVEL = 280;
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
  "dteearth%": "% luka ke Bumi",
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

// ─── PARSE COMMAND TEXT ───────────────────────────────────────────────────────
function parseCommand(text) {
  const config = {
    positiveStats: [],
    negativeStats: [],
    characterLevel: DEFAULT_LEVEL,
    startingPotential: DEFAULT_POTENTIAL,
    profession: "NULL",
    professionLevel: 0,
  };

  const input = text.toLowerCase();

  const lvMatch = input.match(/lv(\d+)/);
  if (lvMatch) config.characterLevel = Math.min(500, Math.max(1, +lvMatch[1]));

  const potMatch = input.match(/pot(\d+)/);
  if (potMatch)
    config.startingPotential = Math.min(200, Math.max(0, +potMatch[1]));

  const profMatch = input.match(
    /(?:prof\s*[:=]?\s*(?:bs\s*[:=]?\s*)?|bs\s*[:=]?\s*)(\d+)/i,
  );
  if (profMatch) {
    config.profession = "BS";
    config.professionLevel = +profMatch[1];
  }

  const parts = input.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (!part || /^(lv|pot|prof|bs|alchemist)\d*/.test(part)) continue;

    const m = part.match(/^([a-z%]+)\s*=\s*(.+)$/);
    if (!m) continue;

    const [, key, val] = m;
    const fullName = statMap[key];
    if (!fullName) continue;

    const isMin = val === "min";
    const isMax = val === "max" || !isMin;
    const level = isMin
      ? "0"
      : val === "max"
        ? "MAX"
        : String(parseInt(val, 10) || 1);
    const obj = { name: fullName, level };

    if (isMin) {
      if (config.negativeStats.length < 7) config.negativeStats.push(obj);
    } else {
      if (config.positiveStats.length < 7) config.positiveStats.push(obj);
    }
  }

  return config;
}

// ─── FETCH FORM DEFAULTS (get option values for dropdowns) ────────────────────
async function fetchFormDefaults() {
  const { data } = await axios.get(BASE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: 20000,
  });

  const $ = cheerio.load(data);
  const defaults = {};

  // Extract select option max values (for MAX stat levels)
  for (let i = 0; i < 7; i++) {
    const plusOpts = $(`#plus_value_${i} option`);
    const minusOpts = $(`#minus_value_${i} option`);
    defaults[`plus_max_${i}`] = plusOpts.last().val() || "10";
    defaults[`minus_max_${i}`] = minusOpts.last().val() || "10";

    // Also grab all options for profession level
    const jukuOpts = $("#jukurendo option");
    defaults.jukurendo_opts = jukuOpts.map((_, el) => $(el).val()).get();
  }

  // Get hidden fields / CSRF tokens if any
  $("input[type=hidden]").each((_, el) => {
    const name = $(el).attr("name");
    const value = $(el).attr("value") || "";
    if (name) defaults[name] = value;
  });

  return { $, defaults, html: data };
}

// ─── BUILD FORM PAYLOAD ───────────────────────────────────────────────────────
function buildPayload(statConfig, defaults) {
  const {
    characterLevel,
    startingPotential,
    profession,
    professionLevel,
    positiveStats,
    negativeStats,
  } = statConfig;

  const payload = new URLSearchParams();

  payload.append("paramLevel", characterLevel);
  payload.append("shokiSenzai", startingPotential);
  payload.append("shokugyou", profession);

  // Profession level - find closest option
  if (professionLevel > 0 && defaults.jukurendo_opts?.length) {
    const target = String(professionLevel);
    const opt =
      defaults.jukurendo_opts.find((v) => v === target) ||
      defaults.jukurendo_opts.find((v) => v.includes(target)) ||
      defaults.jukurendo_opts[defaults.jukurendo_opts.length - 1];
    payload.append("jukurendo", opt);
    payload.append("shokugyouLv", opt);
  }

  // Positive stats (slots 0–6)
  for (let i = 0; i < 7; i++) {
    const stat = positiveStats[i];
    if (stat) {
      payload.append(`plus_name_${i}`, stat.name);
      const val =
        stat.level === "MAX" ? defaults[`plus_max_${i}`] || "10" : stat.level;
      payload.append(`plus_value_${i}`, val);
    } else {
      payload.append(`plus_name_${i}`, "");
      payload.append(`plus_value_${i}`, "0");
    }
  }

  // Negative stats (slots 0–6)
  for (let i = 0; i < 7; i++) {
    const stat = negativeStats[i];
    if (stat) {
      payload.append(`minus_name_${i}`, stat.name);
      const val =
        stat.level === "0" ? defaults[`minus_max_${i}`] || "10" : stat.level;
      payload.append(`minus_value_${i}`, val);
    } else {
      payload.append(`minus_name_${i}`, "");
      payload.append(`minus_value_${i}`, "0");
    }
  }

  // Hidden fields (CSRF etc.)
  Object.entries(defaults).forEach(([k, v]) => {
    if (typeof v === "string" && !payload.has(k)) {
      payload.append(k, v);
    }
  });

  return payload;
}

// ─── PARSE HTML RESULT ────────────────────────────────────────────────────────
function parseHtmlResult(html) {
  const $ = cheerio.load(html);
  const text = $.text() || $("body").text();

  const match = (pattern) => {
    const m = text.match(pattern);
    return m ? m[1] : null;
  };

  // Success rate
  const srRaw = match(/Success\s+Rate\s*[：:]\s*(\d+(?:\.\d+)?)\s*%/i);
  const successRateValue = srRaw !== null ? parseFloat(srRaw) : null;

  // Starting pot
  const startingPot = match(/Starting\s+Pot[：:]\s*(\d+)\s*pt/i);

  // Steps
  const steps = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+\.\s/.test(l));

  // Material cost
  const mats = {};
  ["Metal", "Cloth", "Beast", "Wood", "Medicine", "Mana"].forEach((mat) => {
    const m = text.match(
      new RegExp(`${mat}[：:]\\s*(\\d+(?:,\\d+)*)\\s*pt`, "i"),
    );
    if (m && m[1] !== "0") mats[mat.toLowerCase()] = m[1];
  });
  const materialCost =
    Object.entries(mats)
      .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}:${v}pt`)
      .join(", ") || null;

  // Highest step cost
  const highestStepCost = match(
    /Highest\s+mat(?:s|erial)?\s+per\s+step[：:]\s*([\d,]+(?:\.\d+)?)\s*pt/i,
  );

  // Reduction
  const redM = text.match(/\((\d+%)\s*reduction\s*by\s*(\w+)\)/i);
  const reduction = redM ? `${redM[1]} by ${redM[2]}` : null;

  const hasValidResult =
    successRateValue !== null &&
    successRateValue >= 0 &&
    successRateValue <= 100 &&
    steps.length > 0;

  return {
    hasValidResult,
    successRateValue,
    successRate: successRateValue !== null ? `${successRateValue}%` : null,
    startingPot: startingPot ? `${startingPot}pt` : null,
    steps,
    totalSteps: steps.length,
    materialCost,
    materialDetails: { ...mats, ...(reduction ? { reduction } : {}) },
    highestStepCost: highestStepCost ? `${highestStepCost}pt` : null,
    timestamp: new Date().toISOString(),
  };
}

// ─── MAIN HANDLER (Vercel Serverless) ────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { text } = req.query;

  // ── Health / info route ──
  if (!text) {
    return res.status(200).json({
      ok: true,
      service: "Toram Filarm API",
      endpoint: "GET /api/toram/filarm?text=<command>",
      syntax: "stat=level, lv<num>, pot<num>, bs<num>",
      levels: "'max' = highest positive, 'min' = lowest negative, or a number",
      examples: [
        "cd=max,acc=min,lv280,pot110",
        "atk%=max,cr=max,def%=min,lv300,pot120,bs300",
        "matk%=max,int%=max,cspd%=max,mp%=max,aspd=min,lv280,pot100",
      ],
      availableStats: statMap,
    });
  }

  const start = Date.now();

  try {
    const statConfig = parseCommand(text);

    if (
      statConfig.positiveStats.length === 0 &&
      statConfig.negativeStats.length === 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "No valid stats found. Check your stat keys.",
        availableKeys: Object.keys(statMap),
      });
    }

    // 1. Fetch page to get form defaults (select options, hidden fields)
    const { defaults } = await fetchFormDefaults();

    // 2. Build and POST the form
    const payload = buildPayload(statConfig, defaults);

    const { data: resultHtml } = await axios.post(BASE_URL, payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: BASE_URL,
        Origin: "https://tanaka0.work",
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    // 3. Parse result
    const result = parseHtmlResult(resultHtml);
    result.duration = Date.now() - start;
    result.inputConfig = statConfig;

    if (!result.hasValidResult) {
      // Return partial result with debug snippet
      result.debug = resultHtml.substring(0, 1000);
    }

    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
      duration: Date.now() - start,
    });
  }
}
