import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

// ─── Konfigurasi ────────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL ?? "https://neurapi.mochinime.cyou/";
const DOWNLOAD_DIR = path.resolve("public/downloads");
const FFMPEG_PATH = process.env.FFMPEG_PATH ?? "/usr/bin/ffmpeg";

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
        publishedTime: video.publishedTimeText?.simpleText ?? null,
        description: video.descriptionSnippet?.runs?.[0]?.text ?? null,
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
      };
    }
  }
  return null;
};

// ─── Ambil URL stream audio dari ytInitialPlayerResponse ─────────
const extractAudioStreamUrl = (html) => {
  const match = html.match(
    /var ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|window|<\/script)/s,
  );
  if (!match?.[1]) throw new Error("ytInitialPlayerResponse tidak ditemukan");

  const player = JSON.parse(match[1]);
  const formats = [
    ...(player?.streamingData?.adaptiveFormats ?? []),
    ...(player?.streamingData?.formats ?? []),
  ];

  const audioFormats = formats
    .filter((f) => f.mimeType?.startsWith("audio/") && f.url)
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));

  if (audioFormats.length === 0)
    throw new Error("Tidak ada stream audio ditemukan");

  return audioFormats[0].url;
};

// ─── Convert stream audio → MP3 via ffmpeg ───────────────────────
const convertStreamToMp3 = async (streamUrl, outputId, cookieString) => {
  const mp3Path = path.join(DOWNLOAD_DIR, `${outputId}.mp3`);

  await execFileAsync(
    FFMPEG_PATH,
    [
      "-reconnect",
      "1",
      "-reconnect_streamed",
      "1",
      "-reconnect_delay_max",
      "5",
      "-headers",
      `Cookie: ${cookieString}\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n`,
      "-i",
      streamUrl,
      "-vn",
      "-ar",
      "44100",
      "-ac",
      "2",
      "-b:a",
      "192k",
      "-f",
      "mp3",
      "-y",
      mp3Path,
    ],
    { timeout: 120_000 },
  );

  return mp3Path;
};

// ─── Sanitize nama file ──────────────────────────────────────────
const sanitizeFilename = (title) =>
  (title ?? "audio")
    .replace(/[^\w\s\-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);

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

    const cookieString = buildCookieString();

    // ── 1. Cari video ──────────────────────────────────────────
    const searchUrl =
      "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(keyword);

    const searchRes = await fetch(searchUrl, {
      headers: {
        Cookie: cookieString,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
      },
    });

    if (!searchRes.ok) {
      return res
        .status(500)
        .json({ success: false, error: "Gagal mengambil hasil pencarian" });
    }

    const searchHtml = await searchRes.text();
    const searchData = extractInitialData(searchHtml);
    const video = findFirstVideo(searchData);

    if (!video) {
      return res
        .status(404)
        .json({ success: false, error: "Video tidak ditemukan" });
    }

    // Info dasar video — selalu ada di response meski MP3 gagal
    const videoInfo = {
      title: video.title,
      videoId: video.videoId,
      thumbnail: video.thumbnail,
      url: video.url,
      duration: video.duration,
      views: video.views,
      channel: video.channel,
      publishedTime: video.publishedTime,
      description: video.description,
    };

    // ── 2. Buka halaman video ──────────────────────────────────
    let streamUrl = null;
    try {
      const videoRes = await fetch(video.url, {
        headers: {
          Cookie: cookieString,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (videoRes.ok) {
        const videoHtml = await videoRes.text();
        streamUrl = extractAudioStreamUrl(videoHtml);
      }
    } catch (streamErr) {
      console.error("[stream] Gagal ambil stream URL:", streamErr.message);
    }

    // ── 3. Convert → MP3 (opsional, tidak gagalkan response) ──
    let mp3Info = null;
    if (streamUrl) {
      try {
        const fileId = randomUUID();
        const cleanTitle = sanitizeFilename(video.title);
        const outputId = `${cleanTitle}_${fileId}`;

        const mp3Path = await convertStreamToMp3(
          streamUrl,
          outputId,
          cookieString,
        );
        const filename = path.basename(mp3Path);

        mp3Info = {
          download_url: `${BASE_URL}downloads/${filename}`,
          filename,
        };
      } catch (ffmpegErr) {
        console.error("[ffmpeg] Gagal convert MP3:", ffmpegErr.message);
      }
    }

    // ── 4. Response — selalu sukses selama video ditemukan ────
    return res.status(200).json({
      success: true,
      ...videoInfo,
      mp3: mp3Info ?? null,
      mp3_status: mp3Info ? "ready" : "unavailable",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message ?? "Terjadi kesalahan saat memproses",
    });
  }
};
