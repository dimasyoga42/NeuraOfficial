import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── HELPER COOKIE ─────────────────────────────────────────
const buildCookie = (cookies) =>
  Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

// ─── COOKIE ────────────────────────────────────────────────
const COOKIE = buildCookie({
  PHPSESSID: process.env.PHPSESSID,
  yuid_b: process.env.YUID,
  device_token: process.env.TOKEN,
});

// ─── AXIOS CLIENT ──────────────────────────────────────────
const client = axios.create({
  baseURL: "https://www.pixiv.net",
  timeout: 20000,
  headers: {
    Cookie: COOKIE,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    Referer: "https://www.pixiv.net/",
    Accept: "application/json",
  },
});

// ─── DELAY ─────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── HELPER IMAGE VARIANTS ─────────────────────────────────
const buildImageVariants = (url) => {
  if (!url) return [];

  return [
    url, // master default (AMAN)
    url
      .replace("img-master", "img-original")
      .replace(/_p(\d+)_master1200\.jpg/, "_p$1.jpg"),
  ];
};

// ─── FETCH IMAGE (ANTI 403) ────────────────────────────────
const fetchImage = async (url) => {
  return axios.get(url, {
    responseType: "arraybuffer",
    headers: {
      Referer: "https://www.pixiv.net/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      Accept: "image/*,*/*",
    },
    timeout: 20000,
    validateStatus: () => true,
  });
};

// ─── SEARCH ────────────────────────────────────────────────
export const searchPixiv = async (req, res) => {
  try {
    const {
      query = "anime",
      page = 1,
      order = "date_d",
      mode = "all",
    } = req.query;

    const { data } = await client.get(
      `/ajax/search/artworks/${encodeURIComponent(query)}`,
      {
        params: {
          word: query,
          order,
          mode,
          p: page,
          s_mode: "s_tag",
        },
      },
    );

    const items = data?.body?.illustManga?.data || [];

    const results = items.map((item) => ({
      id: item.id,
      title: item.title,
      image: item.url, // pakai master
      proxy: `/pixiv/image?url=${encodeURIComponent(item.url)}`,
      user: item.userName,
      user_id: item.userId,
    }));

    res.json({
      success: true,
      page,
      total: results.length,
      data: results,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ─── DETAIL ────────────────────────────────────────────────
export const detailPixiv = async (req, res) => {
  try {
    const { id } = req.params;

    const { data } = await client.get(`/ajax/illust/${id}`);
    const body = data?.body;

    res.json({
      success: true,
      id: body.id,
      title: body.title,
      description: body.description,
      tags: body.tags?.tags || [],
      user: body.userName,
      images: body.urls,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ─── PROXY IMAGE (FIX 404 + FORBIDDEN) ─────────────────────
export const proxyImage = async (req, res) => {
  try {
    let { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "url required" });
    }

    url = decodeURIComponent(url);

    const variants = buildImageVariants(url);

    let response;

    for (const u of variants) {
      try {
        response = await fetchImage(u);

        if (response.status === 200) {
          console.log("✓ SUCCESS:", u);
          break;
        } else {
          console.log("✗ FAIL:", u, response.status);
        }
      } catch {
        console.log("✗ ERROR:", u);
      }
    }

    if (!response || response.status !== 200) {
      return res.status(404).json({
        error: "image not found",
      });
    }

    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader("Cache-Control", "public, max-age=86400"); // cache 1 hari

    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ─── BULK DOWNLOAD ─────────────────────────────────────────
export const bulkDownload = async (req, res) => {
  try {
    const { query = "anime", limit = 10 } = req.body;

    const dir = path.join(__dirname, "downloads", query);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const { data } = await client.get(
      `/ajax/search/artworks/${encodeURIComponent(query)}`,
      {
        params: {
          word: query,
          order: "date_d",
          mode: "all",
          p: 1,
          s_mode: "s_tag",
        },
      },
    );

    const items = data?.body?.illustManga?.data || [];

    let success = 0;
    let failed = 0;

    for (let i = 0; i < Math.min(limit, items.length); i++) {
      const item = items[i];

      const variants = buildImageVariants(item.url);

      let downloaded = false;

      for (const u of variants) {
        try {
          const img = await fetchImage(u);

          if (img.status !== 200) continue;

          const file = path.join(dir, `${item.id}.jpg`);
          fs.writeFileSync(file, img.data);

          success++;
          downloaded = true;

          console.log(`✓ ${item.id}`);
          break;
        } catch {}
      }

      if (!downloaded) failed++;

      await delay(800);
    }

    res.json({
      success: true,
      downloaded: success,
      failed,
      folder: dir,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
