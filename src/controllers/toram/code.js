import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// ===================== KONFIGURASI =====================
const TOKEN = process.env.DC_TOKEN;
if (!TOKEN) {
  console.error("DISCORD_TOKEN tidak ditemukan.");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // pakai service_role key (server-side)
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "SUPABASE_URL atau SUPABASE_SERVICE_KEY tidak ditemukan di .env",
  );
  process.exit(1);
}

const headers = {
  Authorization: `${TOKEN}`,
  "Content-Type": "application/json",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Delay antar command supaya tidak kena rate limit Discord & tidak spam bot target.
const DELAY_BETWEEN_COMMANDS_MS = 2000;

/*
  ===================== SKEMA TABEL (jalankan di Supabase SQL editor) =====================

  create table if not exists skill_trees (
    id uuid primary key default gen_random_uuid(),
    category text not null,          -- WEAPON / BUFF / dst
    name text unique not null,        -- Barehand Skills, dst
    raw_skill_names text[],           -- daftar nama skill mentah dari discord
    created_at timestamptz default now()
  );

  create table if not exists skills (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    skill_tree text,
    category text,
    tier text,
    description text,
    raw_embed jsonb,                  -- simpan embed asli untuk backup/debug
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
*/

// ===================== DISCORD SERVICE =====================

let myBotId = null;

async function discord(path, options = {}) {
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function getMyBotId() {
  if (myBotId) return myBotId;
  const me = await discord("/users/@me");
  myBotId = me.id;
  return myBotId;
}

async function sendMessageToChannel(channelId, content) {
  return discord(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

async function getRecentMessages(channelId, { limit = 10, after } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (after) params.set("after", after);
  const data = await discord(
    `/channels/${channelId}/messages?${params.toString()}`,
  );
  return Array.isArray(data) ? data : [];
}

/**
 * Kirim command ke channel, lalu polling pesan baru sampai menemukan balasan
 * dari bot LAIN (bukan bot kita sendiri) — misal Toram Xensei.
 */
async function sendCommandAndWaitReply(
  channelId,
  content,
  { expectAuthorId, timeoutMs = 20000, pollMs = 1500 } = {},
) {
  const myId = await getMyBotId();
  const sentMessage = await sendMessageToChannel(channelId, content);

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await sleep(pollMs);
    const messages = await getRecentMessages(channelId, {
      limit: 10,
      after: sentMessage.id,
    });

    const candidate = messages.find((m) => {
      if (m.author.id === myId) return false; // skip pesan kita sendiri
      if (expectAuthorId) return m.author.id === expectAuthorId;
      return m.author.bot === true; // asumsikan balasan datang dari sebuah bot
    });

    if (candidate) return candidate;
  }

  throw new Error(
    `Timeout menunggu balasan bot untuk command: "${content}" (channel ${channelId})`,
  );
}

// ===================== PARSER =====================
// PENTING: Parsing di bawah ini berdasarkan tampilan visual dari screenshot.
// Kalau hasil parsing meleset, cek raw_embed yang tersimpan di Supabase lalu
// sesuaikan regex/logic di bawah.

/**
 * Parsing balasan ">skilltree" (tanpa nama) -> daftar kategori & skill tree.
 * @returns {Array<{category: string, treeName: string}>}
 */
function parseSkillTreeIndex(message) {
  const embed = message.embeds?.[0];
  const description = embed?.description || message.content || "";
  const lines = description.split("\n").map((l) => l.trim());

  const result = [];
  let currentCategory = null;

  for (const line of lines) {
    if (!line) continue;

    const headerMatch = line.match(/^\*\*(.+?):?\*\*$/);
    if (headerMatch) {
      currentCategory = headerMatch[1].trim();
      continue;
    }

    if (!currentCategory) continue; // lewati baris instruksi sebelum header pertama

    result.push({ category: currentCategory, treeName: line });
  }

  return result;
}

/**
 * Parsing balasan ">skilltree [nama]" -> daftar nama skill di dalam tree tsb.
 * @returns {{category: string, treeName: string, skills: string[]}}
 */
function parseSkillTreeDetail(message) {
  const embed = message.embeds?.[0];
  const description = embed?.description || message.content || "";
  const lines = description.split("\n").map((l) => l.trim());

  let category = null;
  let treeName = null;
  const skills = [];
  let insideList = false;

  const headerRegex = /^\*\*\[(.+?)\]\s*(.+?):?\*\*$/;

  for (const line of lines) {
    if (!line) continue;

    const headerMatch = line.match(headerRegex);
    if (headerMatch) {
      category = headerMatch[1].trim();
      treeName = headerMatch[2].replace(/:$/, "").trim();
      insideList = true;
      continue;
    }

    if (insideList) skills.push(line);
  }

  return { category, treeName, skills };
}

/**
 * Parsing balasan ">skill [nama]" -> detail satu skill.
 * @returns {{name: string, description: string, skillTree: string|null, tier: string|null}}
 */
function parseSkillDetail(message) {
  const embed = message.embeds?.[0];
  const title = embed?.title || "";
  const description = embed?.description || message.content || "";
  const fields = embed?.fields || [];

  const nameMatch = title.match(/Skill information for:\s*(.+)/i);
  const name = nameMatch ? nameMatch[1].trim() : title.trim();

  let skillTree = null;
  let tier = null;
  for (const field of fields) {
    const fieldName = (field.name || "").toLowerCase();
    if (fieldName.includes("skill tree"))
      skillTree = field.value?.trim() ?? null;
    if (fieldName.includes("tier")) tier = field.value?.trim() ?? null;
  }

  return { name, description: description.trim(), skillTree, tier };
}

// ===================== SUPABASE =====================

async function upsertSkillTree({ category, name, rawSkillNames }) {
  const { error } = await supabase
    .from("skill_trees")
    .upsert(
      { category, name, raw_skill_names: rawSkillNames },
      { onConflict: "name" },
    );
  if (error)
    throw new Error(`Supabase upsert skill_trees gagal: ${error.message}`);
}

async function upsertSkill({
  name,
  skillTree,
  category,
  tier,
  description,
  rawEmbed,
}) {
  const { error } = await supabase.from("skills").upsert(
    {
      name,
      skill_tree: skillTree,
      category,
      tier,
      description,
      raw_embed: rawEmbed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "name" },
  );
  if (error) throw new Error(`Supabase upsert skills gagal: ${error.message}`);
}

// ===================== ORCHESTRATOR + STATE =====================

// Status progres disimpan di memori (single-run). Untuk multi-user/persisten,
// pindahkan ke Supabase/Redis.
export const scrapeState = {
  running: false,
  startedAt: null,
  finishedAt: null,
  currentStep: null,
  totalTrees: 0,
  processedTrees: 0,
  totalSkills: 0,
  processedSkills: 0,
  errors: [],
};

function resetState() {
  scrapeState.running = true;
  scrapeState.startedAt = new Date().toISOString();
  scrapeState.finishedAt = null;
  scrapeState.currentStep = "starting";
  scrapeState.totalTrees = 0;
  scrapeState.processedTrees = 0;
  scrapeState.totalSkills = 0;
  scrapeState.processedSkills = 0;
  scrapeState.errors = [];
}

/**
 * Jalankan full scraping: >skilltree -> tiap tree -> tiap skill -> simpan ke Supabase.
 * @param {string} channelId - channel tempat mengirim command & membaca balasan bot
 * @param {string} [botUserId] - user id Toram Xensei (disarankan diisi biar akurat)
 */
export async function runFullScrape(channelId, botUserId) {
  if (scrapeState.running) {
    throw new Error("Scraping sedang berjalan, tunggu sampai selesai.");
  }

  resetState();

  try {
    // ---------- STEP 1: ambil index kategori & nama skill tree ----------
    scrapeState.currentStep = "mengambil daftar skill tree";
    const indexReply = await sendCommandAndWaitReply(channelId, ">skilltree", {
      expectAuthorId: botUserId,
    });
    const treeIndex = parseSkillTreeIndex(indexReply);

    scrapeState.totalTrees = treeIndex.length;

    // ---------- STEP 2: untuk tiap skill tree, ambil daftar skill di dalamnya ----------
    for (const { category, treeName } of treeIndex) {
      scrapeState.currentStep = `skilltree: ${treeName}`;
      try {
        await sleep(DELAY_BETWEEN_COMMANDS_MS);
        const treeReply = await sendCommandAndWaitReply(
          channelId,
          `>skilltree ${treeName}`,
          { expectAuthorId: botUserId },
        );
        const detail = parseSkillTreeDetail(treeReply);

        await upsertSkillTree({
          category: detail.category || category,
          name: detail.treeName || treeName,
          rawSkillNames: detail.skills,
        });

        scrapeState.totalSkills += detail.skills.length;

        // ---------- STEP 3: untuk tiap skill, ambil detailnya ----------
        for (const skillName of detail.skills) {
          scrapeState.currentStep = `skill: ${skillName}`;
          try {
            await sleep(DELAY_BETWEEN_COMMANDS_MS);
            const skillReply = await sendCommandAndWaitReply(
              channelId,
              `>skill ${skillName}`,
              { expectAuthorId: botUserId },
            );
            const skillDetail = parseSkillDetail(skillReply);

            await upsertSkill({
              name: skillDetail.name || skillName,
              skillTree: skillDetail.skillTree || detail.treeName || treeName,
              category: detail.category || category,
              tier: skillDetail.tier,
              description: skillDetail.description,
              rawEmbed: skillReply.embeds?.[0] ?? null,
            });
          } catch (err) {
            scrapeState.errors.push({ skillName, message: err.message });
          } finally {
            scrapeState.processedSkills += 1;
          }
        }
      } catch (err) {
        scrapeState.errors.push({ treeName, message: err.message });
      } finally {
        scrapeState.processedTrees += 1;
      }
    }

    scrapeState.currentStep = "selesai";
  } catch (err) {
    scrapeState.errors.push({ step: "index", message: err.message });
  } finally {
    scrapeState.running = false;
    scrapeState.finishedAt = new Date().toISOString();
  }
}

// ===================== CONTROLLERS (Express) =====================

// POST /scrape/skilltree
// Body: { "channelId": "1463335655487836180", "botUserId": "xxxxx" (opsional) }
export function startScrapeHandler(req, res) {
  const { channelId, botUserId } = req.query;

  if (!channelId) {
    return res.status(400).json({
      success: false,
      message: "Field 'channelId' wajib diisi.",
    });
  }

  if (scrapeState.running) {
    return res.status(409).json({
      success: false,
      message:
        "Scraping lain sedang berjalan. Cek progress di GET /scrape/status.",
    });
  }

  runFullScrape(channelId, botUserId).catch((err) => {
    console.error("Scrape gagal total:", err.message);
  });

  res.json({
    success: true,
    message: "Scraping dimulai. Cek progres di GET /scrape/status.",
  });
}

// GET /scrape/status
export function getScrapeStatusHandler(req, res) {
  res.json({ success: true, data: scrapeState });
}

// ===================== ROUTES (contoh pendaftaran) =====================
// router.post("/scrape/skilltree", startScrapeHandler);
// router.get("/scrape/status", getScrapeStatusHandler);
