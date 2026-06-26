import express from "express";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.DC_TOKEN;
if (!TOKEN) {
  console.error("DISCORD_TOKEN tidak ditemukan.");
  process.exit(1);
}

const headers = {
  Authorization: `${TOKEN}`,
  "Content-Type": "application/json",
};

// ===================== SERVICE =====================
async function discord(path) {
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    headers,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

// Mengambil SELURUH history channel (loop pagination penuh).
// Dipakai khusus oleh endpoint /messages/simple.
async function getAllMessages(channelId) {
  const messages = [];
  let before = null;
  while (true) {
    let endpoint = `/channels/${channelId}/messages?limit=100`;
    if (before) {
      endpoint += `&before=${before}`;
    }
    const data = await discord(endpoint);
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }
    messages.push(...data);
    if (data.length < 100) {
      break;
    }
    before = data[data.length - 1].id;
  }
  return messages;
}

// Hanya melakukan satu kali fetch ke Discord (maksimal 100 pesan, sesuai batas API Discord).
// Jumlah pesan & arah pagination dikontrol lewat query param: limit, before, after, around.
async function getRecentMessages(
  channelId,
  { limit = 50, before, after, around } = {},
) {
  // Discord API hanya mengizinkan limit 1-100 per request
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const params = new URLSearchParams({ limit: String(safeLimit) });
  if (before) params.set("before", before);
  if (after) params.set("after", after);
  if (around) params.set("around", around);

  const data = await discord(
    `/channels/${channelId}/messages?${params.toString()}`,
  );
  return Array.isArray(data) ? data : [];
}

// ===================== CONTROLLERS =====================

export function getStatus(req, res) {
  res.json({
    success: true,
    message: "Discord API Ready",
  });
}

async function getMe(req, res) {
  try {
    const bot = await discord("/users/@me");
    res.json(bot);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function getGuilds(req, res) {
  try {
    const guilds = await discord("/users/@me/guilds");
    res.json({
      success: true,
      total: guilds.length,
      data: guilds,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// Tipe channel teks/forum yang relevan untuk dibaca (0=text, 5=news, 11/12=thread, 15=forum)
const TEXT_CHANNEL_TYPES = [0, 5, 11, 12, 15];

export async function getGuildChannels(req, res) {
  try {
    const channels = await discord(`/guilds/${req.params.guildId}/channels`);
    res.json({
      success: true,
      total: channels.length,
      data: channels.filter((c) => TEXT_CHANNEL_TYPES.includes(c.type)),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// GET /channels/:channelId/messages
// Hanya mengambil pesan terbaru (satu kali fetch), dikontrol lewat query param:
// limit, before, after, around
export async function getRecentMessagesHandler(req, res) {
  try {
    const { limit, before, after, around } = req.query;
    const messages = await getRecentMessages(req.params.channelId, {
      limit,
      before,
      after,
      around,
    });
    res.json({
      success: true,
      total: messages.length,
      data: messages,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// GET /channels/:channelId/messages/simple
// Mengambil SELURUH history channel, lalu disederhanakan strukturnya.
export async function getSimpleMessages(req, res) {
  try {
    const messages = await getAllMessages(req.params.channelId);
    res.json({
      success: true,
      total: messages.length,
      data: messages.map((m) => ({
        id: m.id,
        content: m.content,
        timestamp: m.timestamp,
        author: {
          id: m.author.id,
          username: m.author.username,
          global_name: m.author.global_name,
        },
        attachments: m.attachments,
        url: `https://discord.com/channels/@me/${m.channel_id}/${m.id}`,
      })),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// ===================== ROUTES =====================
