import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);
const fsPromises = fs.promises;

const BASE_URL = (
  process.env.BASE_URL ?? "https://neurapi.mochinime.cyou"
).replace(/\/$/, "");
const DOWNLOAD_DIR = path.resolve("public/downloads");
const YTDLP_PATH =
  process.env.YTDLP_PATH ?? process.env.YT_DLP_PATH ?? "yt-dlp";
const MAX_RETENTION_AGE = 25 * 60 * 1000;

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

const cleanOldDownloads = async () => {
  const currentTime = Date.now();
  try {
    const isAccessible = await fsPromises
      .access(DOWNLOAD_DIR)
      .then(() => true)
      .catch(() => false);
    if (!isAccessible) return;

    const files = await fsPromises.readdir(DOWNLOAD_DIR);
    if (files.length === 0) return;

    const deletionPromises = files.map(async (file) => {
      const filePath = path.join(DOWNLOAD_DIR, file);
      try {
        const stat = await fsPromises.stat(filePath);
        if (stat.isFile() && currentTime - stat.mtimeMs > MAX_RETENTION_AGE) {
          await fsPromises.unlink(filePath);
          return file;
        }
      } catch {
        return null;
      }
      return null;
    });

    const results = await Promise.all(deletionPromises);
    const deleted = results.filter((f) => f !== null);
    if (deleted.length > 0) {
      console.log(`[cleanup] ${deleted.length} file dihapus dari downloads`);
    }
  } catch (error) {
    console.error("[cleanup] Gagal membersihkan folder:", error.message);
  }
};

setInterval(cleanOldDownloads, 5 * 60 * 1000);

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

const sanitizeFilename = (title) =>
  (title ?? "audio")
    .replace(/[^\w\s\-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);

const buildEnvWithNode = () => {
  const nodePath = path.dirname(process.execPath);
  const currentPath = process.env.PATH ?? "";
  const pathHasNode = currentPath.split(":").includes(nodePath);
  return {
    ...process.env,
    PATH: pathHasNode ? currentPath : `${nodePath}:${currentPath}`,
  };
};

const downloadWithYtdlp = async (videoUrl, outputId) => {
  const filename = `${outputId}.mp3`;
  const mp3Path = path.join(DOWNLOAD_DIR, filename);

  const args = [
    "--js-runtimes",
    "node",
    "--extract-audio",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "2",
    "--output",
    mp3Path,
    "--no-playlist",
    "--extractor-retries",
    "3",
    "--fragment-retries",
    "3",
    "--retry-sleep",
    "3",
    "--no-warnings",
  ];

  const cookiesFile = process.env.YT_COOKIES_FILE;
  if (cookiesFile && fs.existsSync(cookiesFile)) {
    args.push("--cookies", cookiesFile);
  }

  args.push(videoUrl);

  try {
    await execFileAsync(YTDLP_PATH, args, {
      timeout: 300000,
      maxBuffer: 50 * 1024 * 1024,
      env: buildEnvWithNode(),
    });
  } catch (err) {
    if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
    throw new Error(`yt-dlp gagal: ${err.message}`);
  }

  if (!fs.existsSync(mp3Path)) {
    throw new Error("File MP3 tidak terbuat setelah download");
  }

  const stat = fs.statSync(mp3Path);
  if (stat.size < 1024) {
    fs.unlinkSync(mp3Path);
    throw new Error("File MP3 terlalu kecil, kemungkinan corrupt");
  }

  return { mp3Path, filename };
};

export const playControllers = async (req, res) => {
  try {
    const { query } = req.query ?? {};

    if (!query || typeof query !== "string" || !query.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Query wajib diisi" });
    }

    const keyword = query.trim();
    const cookieString = buildCookieString();

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

    let searchData;
    try {
      searchData = extractInitialData(searchHtml);
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, error: `Parse search gagal: ${err.message}` });
    }

    const video = findFirstVideo(searchData);
    if (!video) {
      return res
        .status(404)
        .json({ success: false, error: "Video tidak ditemukan" });
    }

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

    let mp3Info = null;
    try {
      const fileId = randomUUID();
      const cleanTitle = sanitizeFilename(video.title);
      const outputId = `${cleanTitle}_${fileId}`;

      const { filename } = await downloadWithYtdlp(video.url, outputId);

      mp3Info = {
        download_url: `${BASE_URL}/downloads/${filename}`,
        filename,
      };

      console.log("[yt-dlp] Berhasil:", filename);
    } catch (dlErr) {
      console.error("[yt-dlp] Gagal:", dlErr.message);
    }

    return res.status(200).json({
      success: true,
      ...videoInfo,
      mp3: mp3Info ?? null,
      mp3_status: mp3Info ? "ready" : "unavailable",
    });
  } catch (error) {
    console.error("[playController]", error);
    return res.status(500).json({
      success: false,
      error: error?.message ?? "Terjadi kesalahan saat memproses",
    });
  }
};
