import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

// ─── Konfigurasi Direktori Temporer Sistem ───────────────────────
const BASE_URL = process.env.BASE_URL ?? "https://neurapi.mochinime.cyou/";
const YT_DLP_PATH = process.env.YT_DLP_PATH ?? "/home/ubuntu/.local/bin/yt-dlp";
const TMP_DIR = os.tmpdir();

// ─── Pengendali Pengunduhan Dinamis (Cleanup Otomatis) ───────────
export const downloadController = (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename); 
  const filePath = path.join(TMP_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: "Berkas tidak ditemukan atau telah kedaluwarsa" });
  }

  // Mengirimkan berkas sebagai stream dan menghapusnya segera setelah selesai
  res.download(filePath, safeFilename, (err) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (unlinkErr) {
      console.error("[Sistem Berkas] Gagal membersihkan berkas temporer:", unlinkErr.message);
    }
  });
};

// ─── Pengendali Utama Pemutaran dan Pemrosesan Media ─────────────
export const playController = async (req, res) => {
  try {
    const { query } = req.query ?? {};

    if (!query || typeof query !== "string") {
      return res.status(400).json({ success: false, error: "Query wajib diisi" });
    }

    const keyword = query.trim();
    if (!keyword) {
      return res.status(400).json({ success: false, error: "Query tidak valid" });
    }

    const searchArgs = [
      "--dump-json",
      "--no-playlist",
      `ytsearch1:${keyword}`
    ];

    let videoData;
    try {
      const { stdout } = await execFileAsync(YT_DLP_PATH, searchArgs, {
        maxBuffer: 50 * 1024 * 1024,
      });
      videoData = JSON.parse(stdout.trim());
    } catch (searchErr) {
      console.error("[yt-dlp resolusi] Kegagalan analitik:", searchErr.message);
      return res.status(404).json({ success: false, error: "Media tidak teridentifikasi atau akses jaringan ditolak" });
    }

    const videoInfo = {
      title: videoData.title,
      videoId: videoData.id,
      thumbnail: videoData.thumbnail,
      url: videoData.webpage_url,
      duration: videoData.duration_string || `${Math.floor(videoData.duration / 60)}:${videoData.duration % 60}`,
      views: `${videoData.view_count?.toLocaleString("id-ID") ?? 0} tayangan`,
      channel: videoData.uploader,
      publishedTime: videoData.upload_date,
      description: videoData.description?.substring(0, 150) || null,
    };

    let mp3Info = null;
    try {
      const fileId = randomUUID();
      const cleanTitle = (videoData.title || "audio")
        .replace(/[^\w\s\-]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 80);
      
      const filename = `${cleanTitle}_${fileId}.mp3`;
      const mp3Path = path.join(TMP_DIR, filename);

      const downloadArgs = [
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "2",
        "--output", mp3Path,
        "--no-playlist",
        videoData.webpage_url
      ];

      if (process.env.YT_COOKIES_FILE) {
        downloadArgs.push("--cookies", process.env.YT_COOKIES_FILE);
      }

      await execFileAsync(YT_DLP_PATH, downloadArgs, {
        timeout: 300000,
        maxBuffer: 50 * 1024 * 1024,
      });

      mp3Info = {
        download_url: `${BASE_URL}api/download/${filename}`,
        filename,
      };
    } catch (downloadErr) {
      console.error("[yt-dlp transkoding] Interupsi sistem:", downloadErr.message);
    }

    return res.status(200).json({
      success: true,
      ...videoInfo,
      mp3: mp3Info ?? null,
      mp3_status: mp3Info ? "ready" : "unavailable",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message ?? "Terjadi anomali komputasi yang tidak terduga pada peladen utama",
    });
  }
};
