import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

// ─── Konfigurasi ────────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL ?? "https://neurapi.mochinime.cyou/";
const DOWNLOAD_DIR = path.resolve("public/downloads");
// Parameter ekskusi ini mengasumsikan yt-dlp telah terpasang pada variabel lingkungan sistem operasi
const YT_DLP_PATH = process.env.YT_DLP_PATH ?? "/home/ubuntu/.local/bin/yt-dlp";

// Inisialisasi direktori penyimpanan media
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

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

    // ── 1. Tahap Resolusi Metadata Asinkron ─────────────────────
    // Spesifikasi ytsearch1: menginstruksikan modul untuk mengambil tepat satu data teratas
    const searchArgs = ["--dump-json", "--no-playlist", `ytsearch1:${keyword}`];

    let videoData;
    try {
      const { stdout } = await execFileAsync(YT_DLP_PATH, searchArgs, {
        maxBuffer: 50 * 1024 * 1024,
      });
      // Mengurai luaran standar menjadi struktur objek leksikal
      videoData = JSON.parse(stdout.trim());
    } catch (searchErr) {
      console.error("[yt-dlp resolusi] Kegagalan analitik:", searchErr.message);
      return res.status(404).json({
        success: false,
        error: "Media tidak teridentifikasi atau akses jaringan ditolak",
      });
    }

    const videoInfo = {
      title: videoData.title,
      videoId: videoData.id,
      thumbnail: videoData.thumbnail,
      url: videoData.webpage_url,
      duration:
        videoData.duration_string ||
        `${Math.floor(videoData.duration / 60)}:${videoData.duration % 60}`,
      views: `${videoData.view_count?.toLocaleString("id-ID") ?? 0} tayangan`,
      channel: videoData.uploader,
      publishedTime: videoData.upload_date,
      description: videoData.description?.substring(0, 150) || null,
    };

    // ── 2. Tahap Pengunduhan dan Pemrosesan Lanjutan ────────────
    let mp3Info = null;
    try {
      const fileId = randomUUID();
      const cleanTitle = (videoData.title || "audio")
        .replace(/[^\w\s\-]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 80);

      const filename = `${cleanTitle}_${fileId}.mp3`;
      const mp3Path = path.join(DOWNLOAD_DIR, filename);

      const downloadArgs = [
        "--extract-audio",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "2",
        "--output",
        mp3Path,
        "--no-playlist",
        videoData.webpage_url,
      ];

      // Integrasi kredensial jaringan jika diperlukan untuk melewati restriksi usia peladen
      if (process.env.YT_COOKIES_FILE) {
        downloadArgs.push("--cookies", process.env.YT_COOKIES_FILE);
      }

      await execFileAsync(YT_DLP_PATH, downloadArgs, {
        timeout: 300000,
        maxBuffer: 50 * 1024 * 1024,
      });

      mp3Info = {
        download_url: `${BASE_URL}downloads/${filename}`,
        filename,
      };
    } catch (downloadErr) {
      console.error(
        "[yt-dlp transkoding] Interupsi sistem:",
        downloadErr.message,
      );
    }

    // ── 3. Konstruksi Respons RESTful ───────────────────────────
    return res.status(200).json({
      success: true,
      ...videoInfo,
      mp3: mp3Info ?? null,
      mp3_status: mp3Info ? "ready" : "unavailable",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:
        error?.message ??
        "Terjadi anomali komputasi yang tidak terduga pada peladen utama",
    });
  }
};
