import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  MAX_RETRIES: 2,
  DEFAULT_TIMEOUT: 90_000,
  CHECK_INTERVAL: 800,
  DEFAULT_LEVEL: 280,
  DEFAULT_POTENTIAL: 110,
  NAVIGATION_TIMEOUT: 60_000,
  SELECTOR_TIMEOUT: 15_000,
  MAX_CAPTCHA_WAIT: 20,
  BASE_URL: "https://tanaka0.work/id/BouguProper",
};

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

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── PARSE TEXT COMMAND ───────────────────────────────────────────────────────
function parseCommand(text) {
  const config = {
    positiveStats: [],
    negativeStats: [],
    characterLevel: CONFIG.DEFAULT_LEVEL,
    startingPotential: CONFIG.DEFAULT_POTENTIAL,
    profession: "NULL",
    professionLevel: 0,
  };

  const input = text.toLowerCase();

  // Level
  const lvMatch = input.match(/lv(\d+)/);
  if (lvMatch) config.characterLevel = Math.min(500, Math.max(1, +lvMatch[1]));

  // Potential
  const potMatch = input.match(/pot(\d+)/);
  if (potMatch)
    config.startingPotential = Math.min(200, Math.max(0, +potMatch[1]));

  // Profession / BS level
  const profMatch = input.match(
    /(?:prof\s*[:=]?\s*(?:bs\s*[:=]?\s*)?|bs\s*[:=]?\s*)(\d+)/i,
  );
  if (profMatch) {
    config.profession = "BS";
    config.professionLevel = +profMatch[1];
  }

  // Stats
  const parts = input.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (!part) continue;
    if (/^(lv|pot|prof|bs|alchemist)\d*/.test(part)) continue;

    const m = part.match(/^([a-z%]+)\s*=\s*(.+)$/);
    if (!m) continue;

    const [, key, val] = m;
    const fullName = statMap[key];
    if (!fullName) continue;

    const isMin = val === "min";
    const isMax = val === "max";
    const level = isMax || isMin ? "MAX" : String(parseInt(val, 10) || 0);
    const obj = { name: fullName, level };

    if (isMin) {
      if (config.negativeStats.length < 7) config.negativeStats.push(obj);
    } else {
      if (config.positiveStats.length < 7) config.positiveStats.push(obj);
    }
  }

  return config;
}

// ─── SCRAPER ──────────────────────────────────────────────────────────────────
async function scrape(statConfig) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-images",
        "--disable-background-networking",
        "--mute-audio",
        "--no-first-run",
        "--safebrowsing-disable-auto-update",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    // Block heavy resources
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
        ["image", "stylesheet", "font", "media"].includes(req.resourceType())
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(CONFIG.BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout: CONFIG.NAVIGATION_TIMEOUT,
    });

    // Click reload/reset button if present
    await page.evaluate(() => {
      const btn = [
        ...document.querySelectorAll(
          "button, input[type='button'], input[type='submit']",
        ),
      ].find((b) => /reload|reset/i.test(b.value || b.innerText));
      if (btn) btn.click();
    });
    await sleep(2000);

    // Wait for form
    await page.waitForSelector("#paramLevel", {
      timeout: CONFIG.SELECTOR_TIMEOUT,
    });

    // Fill form
    const {
      positiveStats,
      negativeStats,
      startingPotential,
      characterLevel,
      profession,
      professionLevel,
    } = statConfig;

    await page.evaluate(
      ({ level, positive, negative, pot, prof, profLvl }) => {
        const setVal = (sel, val) => {
          const el = document.querySelector(sel);
          if (!el) return;
          el.focus();
          el.value = String(val);
          ["input", "change", "blur"].forEach((e) =>
            el.dispatchEvent(new Event(e, { bubbles: true })),
          );
        };

        const setSelectSmart = (sel, value) => {
          const el = document.querySelector(sel);
          if (!el) return;
          const t = String(value);
          const opt = [...el.options].find(
            (o) =>
              o.value === t || o.value.includes(t) || o.textContent.includes(t),
          );
          if (opt) {
            el.value = opt.value;
            el.dispatchEvent(new Event("change", { bubbles: true }));
          }
        };

        const fillStat = (nameSel, valSel, name, lvl) => {
          setVal(nameSel, name);
          const el = document.querySelector(valSel);
          if (lvl === "MAX" && el?.options?.length > 0) {
            setVal(valSel, el.options[el.options.length - 1].value);
          } else {
            setVal(valSel, lvl);
          }
        };

        setVal("#paramLevel", level);
        setVal("#shokiSenzai", pot);

        const profSel = document.querySelector("#shokugyou");
        if (profSel) {
          profSel.value = prof;
          profSel.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (profLvl > 0) {
          setSelectSmart("#jukurendo", profLvl);
          setSelectSmart("#shokugyouLv", profLvl);
        }

        positive.forEach((s, i) =>
          fillStat(`#plus_name_${i}`, `#plus_value_${i}`, s.name, s.level),
        );
        negative.forEach((s, i) =>
          fillStat(`#minus_name_${i}`, `#minus_value_${i}`, s.name, s.level),
        );
      },
      {
        level: characterLevel,
        positive: positiveStats,
        negative: negativeStats,
        pot: startingPotential,
        prof: profession,
        profLvl: professionLevel,
      },
    );

    // Submit
    await page.click("#sendData");

    // Wait & parse
    const result = await waitForResults(page);
    result.professionLevel = professionLevel;
    return result;
  } finally {
    if (browser) await browser.close();
  }
}

// ─── WAIT FOR RESULTS ─────────────────────────────────────────────────────────
async function waitForResults(page) {
  const deadline = Date.now() + CONFIG.DEFAULT_TIMEOUT;
  let consecutive = 0;

  while (Date.now() < deadline) {
    const state = await page.evaluate(() => ({
      hasResults:
        document.body.innerText.includes("Success Rate") &&
        document.body.innerText.includes("Statting of Armor"),
      hasError: /504|timeout/i.test(document.body.innerText),
    }));

    if (state.hasError)
      throw new Error("Website returned an error (504/timeout)");

    if (state.hasResults) {
      consecutive++;
      if (consecutive >= 2) {
        await sleep(400);
        return parseResults(page);
      }
    } else {
      consecutive = 0;
    }

    await sleep(CONFIG.CHECK_INTERVAL);
  }

  // Last attempt
  return parseResults(page);
}

// ─── PARSE RESULTS ────────────────────────────────────────────────────────────
async function parseResults(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;

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
    const materialCost = Object.entries(mats)
      .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}:${v}pt`)
      .join(", ");

    // Highest step cost
    const highestStepCost = match(
      /Highest\s+mat(?:s|erial)?\s+per\s+step[：:]\s*([\d,]+(?:\.\d+)?)\s*pt/i,
    );

    // Reduction
    const reductionM = text.match(/\((\d+%)\s*reduction\s*by\s*(\w+)\)/i);
    const reduction = reductionM
      ? `${reductionM[1]} by ${reductionM[2]}`
      : null;

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
      materialCost: materialCost || null,
      materialDetails: { ...mats, ...(reduction ? { reduction } : {}) },
      highestStepCost: highestStepCost ? `${highestStepCost}pt` : null,
      timestamp: new Date().toISOString(),
    };
  });
}

// ─── ROUTE: GET /api/toram/filarm ─────────────────────────────────────────────
export const filarm = async (req, res) => {
  const text = req.query.text;

  if (!text) {
    return res.status(400).json({
      ok: false,
      error: "Missing ?text= parameter",
      example: "/api/toram/filarm?text=cd=max,acc=min,lv280,pot110,bs300",
    });
  }

  const start = Date.now();

  try {
    const statConfig = parseCommand(text);

    // Validation
    if (
      statConfig.positiveStats.length === 0 &&
      statConfig.negativeStats.length === 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "No valid stats found in query",
        parsed: statConfig,
        availableStats: Object.keys(statMap),
      });
    }

    const result = await scrape(statConfig);
    result.duration = Date.now() - start;
    result.inputConfig = statConfig;

    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
      duration: Date.now() - start,
    });
  }
};
