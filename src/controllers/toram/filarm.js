import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const BASE_URL = "https://tanaka0.work/id/BouguProper";
const DEFAULT_LEVEL = 280;
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
  const lvM = input.match(/lv(\d+)/);
  if (lvM) config.characterLevel = Math.min(500, Math.max(1, +lvM[1]));
  const potM = input.match(/pot(\d+)/);
  if (potM) config.startingPotential = Math.min(200, Math.max(0, +potM[1]));
  const profM = input.match(
    /(?:prof\s*[:=]?\s*(?:bs\s*[:=]?\s*)?|bs\s*[:=]?\s*)(\d+)/i,
  );
  if (profM) {
    config.profession = "BS";
    config.professionLevel = +profM[1];
  }
  for (const part of input.split(",").map((s) => s.trim())) {
    if (!part || /^(lv|pot|prof|bs|alchemist)\d*/.test(part)) continue;
    const m = part.match(/^([a-z%]+)\s*=\s*(.+)$/);
    if (!m) continue;
    const fullName = statMap[m[1]];
    if (!fullName) continue;
    const isMin = m[2] === "min";
    const level = isMin
      ? "MIN"
      : m[2] === "max"
        ? "MAX"
        : String(parseInt(m[2], 10) || 1);
    if (isMin) {
      if (config.negativeStats.length < 7)
        config.negativeStats.push({ name: fullName, level });
    } else {
      if (config.positiveStats.length < 7)
        config.positiveStats.push({ name: fullName, level });
    }
  }
  return config;
}

async function scrape(statConfig) {
  const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["image", "stylesheet", "font", "media"].includes(req.resourceType()))
        req.abort();
      else req.continue();
    });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    await page.goto(BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    // Reset form if button exists
    await page.evaluate(() => {
      const btn = [
        ...document.querySelectorAll(
          "button,input[type='button'],input[type='submit']",
        ),
      ].find((b) => /reload|reset/i.test(b.value || b.innerText || ""));
      if (btn) btn.click();
    });

    await page.waitForSelector("#paramLevel", { timeout: 10000 });

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
          const opt =
            [...el.options].find((o) => o.value === t) ||
            [...el.options].find((o) => o.textContent.trim().includes(t));
          if (opt) {
            el.value = opt.value;
            el.dispatchEvent(new Event("change", { bubbles: true }));
          }
        };
        const fillStat = (ns, vs, name, lvl) => {
          setVal(ns, name);
          const el = document.querySelector(vs);
          if (!el) return;
          if (lvl === "MAX" && el.options?.length)
            setVal(vs, el.options[el.options.length - 1].value);
          else if (lvl === "MIN" && el.options?.length)
            setVal(vs, el.options[0].value);
          else setVal(vs, lvl);
        };
        setVal("#paramLevel", level);
        setVal("#shokiSenzai", pot);
        const ps = document.querySelector("#shokugyou");
        if (ps) {
          ps.value = prof;
          ps.dispatchEvent(new Event("change", { bubbles: true }));
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

    await Promise.all([
      page.click("#sendData"),
      page.waitForFunction(
        () =>
          document.body.innerText.includes("Success Rate") &&
          document.body.innerText.includes("Statting of Armor"),
        { timeout: 25000 },
      ),
    ]);

    await new Promise((r) => setTimeout(r, 500));

    return await page.evaluate(() => {
      const text = document.body.innerText;
      const match = (pat) => {
        const m = text.match(pat);
        return m ? m[1] : null;
      };
      const srRaw = match(/Success\s+Rate\s*[：:]\s*(\d+(?:\.\d+)?)\s*%/i);
      const successRateValue = srRaw !== null ? parseFloat(srRaw) : null;
      const startingPot = match(/Starting\s+Pot[：:]\s*(\d+)\s*pt/i);
      const steps = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => /^\d+\.\s/.test(l));
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
      const highestStepCost = match(
        /Highest\s+mat(?:s|erial)?\s+per\s+step[：:]\s*([\d,]+(?:\.\d+)?)\s*pt/i,
      );
      const redM = text.match(/\((\d+%)\s*reduction\s*by\s*(\w+)\)/i);
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
          ...(redM ? { reduction: `${redM[1]} by ${redM[2]}` } : {}),
        },
        highestStepCost: highestStepCost ? `${highestStepCost}pt` : null,
        timestamp: new Date().toISOString(),
      };
    });
  } finally {
    await browser.close();
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { text } = req.query;
  if (!text)
    return res.status(200).json({
      ok: true,
      service: "Toram Filarm API",
      endpoint: "GET /api/toram/filarm?text=<command>",
      syntax: "stat=level, lv<num>, pot<num>, bs<num>",
      levels: "max | min | number",
      examples: [
        "cd=max,acc=min,lv280,pot110",
        "atk%=max,cr=max,def%=min,lv300,pot120,bs300",
      ],
      availableStats: statMap,
    });
  const start = Date.now();
  try {
    const statConfig = parseCommand(text);
    if (!statConfig.positiveStats.length && !statConfig.negativeStats.length)
      return res
        .status(400)
        .json({
          ok: false,
          error: "No valid stats found.",
          availableKeys: Object.keys(statMap),
        });
    const result = await scrape(statConfig);
    result.duration = Date.now() - start;
    result.inputConfig = statConfig;
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, error: err.message, duration: Date.now() - start });
  }
}
