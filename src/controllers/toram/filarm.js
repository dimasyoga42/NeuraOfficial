import puppeteer from "puppeteer-core";

const BASE_URL = "https://tanaka0.work/id/BouguProper";

const DEFAULT_LEVEL = 320;
const DEFAULT_POTENTIAL = 110;

const CHROME_PATHS = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
];

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
  rdplayer: "% Reduce Dmg (Player Epicenter)",
  rdline: "% Reduce Dmg (Straight Line)",
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

  "DEF": 32,
  "DEF %": 14,
  "MDEF": 32,
  "MDEF %": 14,

  "Accuracy": 18,
  "Accuracy %": 7,

  "MaxMP": 21,

  "% luka ke Api": 24,
  "% luka ke Air": 24,
  "% luka ke Angin": 24,
  "% luka ke Bumi": 24,
  "% luka ke Cahaya": 24,
  "% luka ke Gelap": 24,
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

  const lvMatch = input.match(/lv(\d+)/);

  if (lvMatch) {
    config.characterLevel = Math.min(
      350,
      Math.max(200, Number(lvMatch[1]))
    );
  }

  const potMatch = input.match(/pot(\d+)/);

  if (potMatch) {
    config.startingPotential = Math.min(
      180,
      Math.max(1, Number(potMatch[1]))
    );
  }

  const rpotMatch = input.match(/rpot(\d+)/);

  if (rpotMatch) {
    config.recipePotential = Math.min(
      180,
      Math.max(1, Number(rpotMatch[1]))
    );
  }

  const bsMatch = input.match(/(?:bs|prof)(\d+)/);

  if (bsMatch) {
    config.professionLevel = Math.min(
      400,
      Math.max(0, Number(bsMatch[1]))
    );
  }

  for (const raw of input.split(",")) {
    const part = raw.trim();

    if (
      !part ||
      /^(lv|pot|rpot|bs|prof)\d*/.test(part)
    ) {
      continue;
    }

    const match = part.match(
      /^([a-z%]+)\s*=\s*(.+)$/
    );

    if (!match) continue;

    let fullName = statMap[match[1]];

    if (!fullName) continue;

    if (Array.isArray(fullName)) {
      fullName =
        fullName[
          Math.floor(
            Math.random() * fullName.length
          )
        ];
    }

    const value = match[2];

    const maxLv =
      statMaxLevel[fullName] || 32;

    let level;

    if (value === "max") {
      level = "MAX";
    } else if (value === "min") {
      level = "MAX";
    } else {
      level = String(
        Math.min(
          maxLv,
          Math.max(
            0,
            Number(value) || 0
          )
        )
      );
    }

    if (value === "min") {
      if (
        config.negativeStats.length < 7
      ) {
        config.negativeStats.push({
          name: fullName,
          level,
        });
      }
    } else {
      if (
        config.positiveStats.length < 7
      ) {
        config.positiveStats.push({
          name: fullName,
          level,
        });
      }
    }
  }

  return config;
}

async function launchBrowser() {
  let lastError;

  for (const executablePath of CHROME_PATHS) {
    try {
      const browser =
        await puppeteer.launch({
          headless: true,
          executablePath,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-extensions",
          ],
        });

      return browser;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

async function setNativeValue(
  page,
  selector,
  value
) {
  await page.evaluate(
    ({ selector, value }) => {
      const el =
        document.querySelector(selector);

      if (!el) return;

      const prototype =
        Object.getPrototypeOf(el);

      const descriptor =
        Object.getOwnPropertyDescriptor(
          prototype,
          "value"
        );

      descriptor.set.call(el, value);

      el.dispatchEvent(
        new Event("input", {
          bubbles: true,
        })
      );

      el.dispatchEvent(
        new Event("change", {
          bubbles: true,
        })
      );
    },
    {
      selector,
      value,
    }
  );
}

async function scrape(statConfig) {
  const browser =
    await launchBrowser();

  try {
    const page =
      await browser.newPage();

    await page.setViewport({
      width: 1366,
      height: 768,
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );

    await page.goto(BASE_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await page.waitForSelector(
      'input[name="paramLevel"]',
      {
        timeout: 60000,
      }
    );

    await setNativeValue(
      page,
      'input[name="paramLevel"]',
      String(statConfig.characterLevel)
    );

    await setNativeValue(
      page,
      'input[name="shokiSenzai"]',
      String(
        statConfig.startingPotential
      )
    );

    await setNativeValue(
      page,
      'input[name="kisoSenzai"]',
      String(
        statConfig.recipePotential
      )
    );

    const profLevel =
      Math.round(
        statConfig.professionLevel / 10
      ) * 10;

    await page.select(
      'select[name="jukurendo"]',
      String(profLevel)
    );

    for (let i = 0; i < 7; i++) {
      const plus =
        statConfig.positiveStats[i];

      if (!plus) continue;

      await page.select(
        `select[name="plusProperList[${i}].properName"]`,
        plus.name
      );

      await page.select(
        `select[name="plusProperList[${i}].properLvHyoji"]`,
        plus.level
      );
    }

    for (let i = 0; i < 7; i++) {
      const minus =
        statConfig.negativeStats[i];

      if (!minus) continue;

      await page.select(
        `select[name="minusProperList[${i}].properName"]`,
        minus.name
      );

      await page.select(
        `select[name="minusProperList[${i}].properLvHyoji"]`,
        minus.level
      );
    }

    const submitButton =
      (await page.$(
        'input[name="sendData"]'
      )) ||
      (await page.$(
        'input[type="submit"]'
      )) ||
      (await page.$(
        'button[type="submit"]'
      ));

    if (!submitButton) {
      throw new Error(
        "Submit button tidak ditemukan"
      );
    }

    await Promise.all([
      page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 60000,
      }),
      submitButton.click(),
    ]);

    const result =
      await page.evaluate(() => {
        const bodyText =
          document.body.innerText;

        const match = (regex) => {
          const m =
            bodyText.match(regex);

          return m ? m[1] : null;
        };

        const successRate = match(
          /Success\s*Rate\s*[：:]\s*(\d+(?:[.,]\d+)?)\s*%/i
        );

        const startingPot = match(
          /Starting\s*Pot\s*[：:]\s*(\d+)\s*pt/i
        );

        const highestStepCost = match(
          /Highest\s+mats?\s+per\s+step\s*[：:]\s*([\d.,]+)\s*pt/i
        );

        const steps = bodyText
          .split("\n")
          .map((v) => v.trim())
          .filter((v) =>
            /^\d+\.\s+/.test(v)
          );

        const materials = {};

        for (const mat of [
          "Metal",
          "Cloth",
          "Beast",
          "Wood",
          "Medicine",
          "Mana",
        ]) {
          const m = bodyText.match(
            new RegExp(
              `${mat}[：:]\\s*([\\d.,]+)\\s*pt`,
              "i"
            )
          );

          if (
            m &&
            m[1] !== "0"
          ) {
            materials[
              mat.toLowerCase()
            ] = m[1];
          }
        }

        return {
          successRate:
            successRate !== null
              ? `${parseFloat(
                  successRate.replace(
                    ",",
                    "."
                  )
                )}%`
              : null,

          startingPot:
            startingPot !== null
              ? `${startingPot}pt`
              : null,

          highestStepCost:
            highestStepCost !== null
              ? `${highestStepCost}pt`
              : null,

          totalSteps:
            steps.length,

          steps,

          materials,

          hasValidResult:
            successRate !== null &&
            steps.length > 0,

          raw: bodyText,
        };
      });

    return result;
  } finally {
    await browser.close();
  }
}

export default async function handler(
  req,
  res
) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { text } = req.query;

  if (!text) {
    return res.status(200).json({
      ok: true,
      service:
        "Toram Filarm API",
      endpoint:
        "/api/toram/filarm?text=<command>",
      example:
        "dte%=max,agi%=max,cd%=max,cr=30,matk%=min,mp=min,acc=min,acc%=min,lv320,bs250,pot65",
    });
  }

  const start = Date.now();

  try {
    const statConfig =
      parseCommand(text);

    if (
      !statConfig.positiveStats
        .length &&
      !statConfig.negativeStats
        .length
    ) {
      return res.status(400).json({
        ok: false,
        error:
          "Tidak ada stat valid ditemukan",
      });
    }

    const result =
      await scrape(statConfig);

    return res.status(200).json({
      ok: true,
      duration:
        Date.now() - start,
      inputConfig: statConfig,
      ...result,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
      stack: err.stack,
      duration:
        Date.now() - start,
    });
  }
}
