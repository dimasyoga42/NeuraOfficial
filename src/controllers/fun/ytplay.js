import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

// ─── Konfigurasi ────────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL ?? "https://neurapi.mochinime.cyou/";
const DOWNLOAD_DIR = path.resolve("public/downloads");
const YTDLP_PATH = process.env.YTDLP_PATH ?? "yt-dlp";
const FFMPEG_PATH = process.env.FFMPEG_PATH ?? "ffmpeg";

// Auto-buat folder jika belum ada
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ─── Cookie Helper ───────────────────────────────────────────────
const buildCookieString = () => {
  const cookieMap = {
    SID: process.env.YT_COOKIE_SID,
    HSID: process.env.YT_COOKIE_HSID,
    SSID: process.env.YT_COOKIE_SSID,
    APISID: process.env.YT_COOKIE_APISID,
    SAPISID: process.env.YT_COOKIE_SAPISID,
    "__Secure-1PAPISID": process.env.YT_COOKIE_SECURE_1PAPISID,
    "__Secure-3PAPISID": process.env.YT_COOKIE_SECURE_3PAPISID,
    LOGIN_INFO: process.env.YT_COOKIE_LOGIN_INFO,
    PREF: process.env.YT_COOKIE_PREF,
  };
  return Object.entries(cookieMap)
    .filter(([, value]) => typeof value === "string" && value.trim() !== "")
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
};

// ─── Scraping Helpers ────────────────────────────────────────────
const extractInitialData = (html) => {
  const patterns = [
    /var ytInitialData = (.+?);<\/script>/s,
    /window\["ytInitialData"\] = (.+?);<\/script>/s,
    /ytInitialData"\s*:\s*(\{.*?\})\s*,\s*"metadata"/s,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {
        continue;
      }
    }
  }
  throw new Error("ytInitialData tidak ditemukan");
};

const findFirstVideo = (data) => {
  const contents =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents ?? [];
  for (const section of contents) {
    const items = section?.itemSectionRenderer?.contents ?? [];
    for (const item of items) {
      const video = item?.videoRenderer;
      if (!video?.videoId) continue;
      return {
        videoId: video.videoId,
        title: video.title?.runs?.[0]?.text ?? null,
        thumbnail:
          video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]
            ?.url ?? null,
        duration: video.lengthText?.simpleText ?? null,
        views: video.viewCountText?.simpleText ?? null,
        channel: video.ownerText?.runs?.[0]?.text ?? null,
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
      };
    }
  }
  return null;
};

// ─── Konversi ke MP3 ─────────────────────────────────────────────
/**
 * Download audio dari YouTube pakai yt-dlp lalu convert ke MP3 via ffmpeg.
 * Return path file MP3 yang sudah jadi.
 *
 * @param {string} videoUrl  - URL YouTube
 * @param {string} outputId  - Nama file unik (tanpa ekstensi)
 * @returns {Promise<string>} - Absolute path ke file .mp3
 */
const convertToMp3 = async (videoUrl, outputId) => {
  const rawOutput = path.join(DOWNLOAD_DIR, `${outputId}.%(ext)s`);
  const mp3Output = path.join(DOWNLOAD_DIR, `${outputId}.mp3`);

  // Langkah 1: Download audio terbaik dengan yt-dlp
  // --no-playlist  → jangan download playlist kalau URL ada mix
  // -x             → extract audio only
  // --audio-format → minta format, tapi kita convert manual biar lebih kontrol
  await execFileAsync(YTDLP_PATH, [
    "--no-playlist",
    "-x",
    "--audio-quality",
    "0", // kualitas terbaik
    "--audio-format",
    "bestaudio", // download format asli dulu
    "--format",
    "bestaudio/best",
    "-o",
    rawOutput,
    videoUrl,
  ]);

  // Cari file hasil download (bisa .webm, .m4a, .opus, dll)
  const files = fs
    .readdirSync(DOWNLOAD_DIR)
    .filter((f) => f.startsWith(outputId) && !f.endsWith(".mp3"));

  if (files.length === 0) {
    throw new Error("yt-dlp gagal mengunduh audio");
  }

  const rawFile = path.join(DOWNLOAD_DIR, files[0]);

  // Langkah 2: Convert ke MP3 320kbps pakai ffmpeg
  await execFileAsync(FFMPEG_PATH, [
    "-i",
    rawFile,
    "-vn", // no video
    "-ar",
    "44100", // sample rate 44.1kHz
    "-ac",
    "2", // stereo
    "-b:a",
    "320k", // bitrate 320kbps
    "-y", // overwrite kalau ada
    mp3Output,
  ]);

  // Hapus file mentah setelah convert berhasil
  fs.unlinkSync(rawFile);

  return mp3Output;
};

// ─── Sanitize nama file ──────────────────────────────────────────
const sanitizeFilename = (title) =>
  (title ?? "audio")
    .replace(/[^\w\s\-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80); // batas panjang nama file

// ─── Controller ─────────────────────────────────────────────────
export const playController = async (req, res) => {
  try {
    const { query } = req.query ?? {};

    if (!query || typeof query !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "Query wajib diisi" });
    }

    const keyword = query.trim();
    if (!keyword) {
      return res
        .status(400)
        .json({ success: false, error: "Query tidak valid" });
    }

    // ── 1. Cari video YouTube ──────────────────────────────────
    const searchUrl =
      "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(keyword);

    const response = await fetch(searchUrl, {
      headers: {
        Cookie: buildCookieString(),
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
      },
    });

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: "Gagal mengambil hasil pencarian",
      });
    }

    const html = await response.text();
    const data = extractInitialData(html);
    const video = findFirstVideo(data);

    if (!video) {
      return res
        .status(404)
        .json({ success: false, error: "Video tidak ditemukan" });
    }

    // ── 2. Download & convert ke MP3 ──────────────────────────
    const fileId = randomUUID();
    const cleanTitle = sanitizeFilename(video.title);
    const outputId = `${cleanTitle}_${fileId}`;

    const mp3Path = await convertToMp3(video.url, outputId);
    const filename = path.basename(mp3Path);

    // ── 3. Buat link download ──────────────────────────────────
    const downloadUrl = `${BASE_URL}/downloads/${filename}`;

    return res.status(200).json({
      success: true,
      title: video.title,
      thumbnail: video.thumbnail,
      url: video.url,
      duration: video.duration,
      views: video.views,
      channel: video.channel,
      mp3: {
        download_url: downloadUrl,
        filename,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message ?? "Terjadi kesalahan saat memproses",
    });
  }
};
