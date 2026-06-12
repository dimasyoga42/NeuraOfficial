import express from "express";
import fsSync from "fs";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

// ─── Konfigurasi Lingkungan Peladen ──────────────────────────────
const BASE_URL = process.env.BASE_URL ?? "https://neurapi.mochinime.cyou/";
const YT_DLP_PATH = process.env.YT_DLP_PATH ?? "/home/ubuntu/.local/bin/yt-dlp";
const TMP_DIR = os.tmpdir();
const PORT = process.env.PORT || 3000;

// Inisialisasi instansiasi aplikasi Express
const app = express();

// ─── Utilitas Pembersihan Direktori Usang ────────────────────────
const cleanOldDownloadsDirectory = async () => {
  const downloadDir = path.resolve("public/downloads");
  try {
    const isAccessible = await fs.access(downloadDir).then(() => true).catch(() => false);
    if (!isAccessible) return;

    const files = await fs.readdir(downloadDir);
    if (files.length === 0) return;

    const deletionPromises = files.map(async (file) => {
      const filePath = path.join(downloadDir, file);
      const fileStats = await fs.stat(filePath);
      if (fileStats.isFile()) {
        await fs.unlink(filePath);
        return file;
      }
      return null;
    });

    const results = await Promise.all(deletionPromises);
    const deletedFiles = results.filter((result) => result !== null);
    console.log(`[Pemeliharaan] Total ${deletedFiles.length} berkas usang berhasil dibersihkan dari memori sekunder.`);
  } catch (error) {
    console.error("[Pemeliharaan] Terjadi anomali saat purifikasi direktori:", error.message);
  }
};

// Eksekusi prosedur pemeliharaan secara asinkron saat peladen melakukan inisialisasi awal
cleanOldDownloadsDirectory();

// ─── Pengendali Pengunduhan Dinamis ──────────────────────────────
const downloadController = (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(TMP_DIR, safeFilename);

  if (!fsSync.existsSync(filePath)) {
    return res.status(404).json({ 
      success: false, 
      error: "Berkas digital tidak ditemukan atau telah musnah setelah melewati masa retensi 20 menit" 
    });
  }

  res.download(filePath, safeFilename, (err) => {
    if (err && !res.headersSent) {
      console.error("[Transmisi] Terjadi interupsi jaringan selama distribusi biner:", err.message);
    }
  });
};

// ─── Pengendali Utama Pemrosesan Media ───────────────────────────
const playController = async (req, res) => {
  try {
    const { query } = req.query ?? {};

    if (!query || typeof query !== "string") {
      return res.status(400).json({ success: false, error: "Parameter kueri wajib dideklarasikan" });
    }

    const keyword = query.trim();
    if (!keyword) {
      return res.status(400).json({ success: false, error: "Parameter kueri tidak memenuhi standar validasi" });
    }

    // Resolusi metadata menggunakan kompilator skrip Node.js
    const searchArgs = [
      "--dump-json",
      "--no-playlist",
      "--js-runtimes", "nodejs"
    ];

    if (process.env.YT_COOKIES_FILE) {
      searchArgs.push("--cookies", process.env.YT_COOKIES_FILE);
    }

    searchArgs.push(`ytsearch1:${keyword}`);

    let videoData;
    try {
      const { stdout } = await execFileAsync(YT_DLP_PATH, searchArgs, { maxBuffer: 50 * 1024 * 1024 });
      videoData = JSON.parse(stdout.trim());
    } catch (searchErr) {
      console.error("[Resolusi] Kegagalan analitik metadata:", searchErr.message);
      return res.status(404).json({ success: false, error: "Sesi ditolak oleh peladen penyedia layanan atau otentikasi kuki tidak valid" });
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

      // Transkoding media biner menggunakan parameter kompilator skrip Node.js
      const downloadArgs = [
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "2",
        "--js-runtimes", "nodejs",
        "--output", mp3Path,
        "--no-playlist"
      ];

      if (process.env.YT_COOKIES_FILE) {
        downloadArgs.push("--cookies", process.env.YT_COOKIES_FILE);
      }

      downloadArgs.push(videoData.webpage_url);

      await execFileAsync(YT_DLP_PATH, downloadArgs, {
        timeout: 300000,
        maxBuffer: 50 * 1024 * 1024,
      });

      const DESTRUCTION_DELAY = 20 * 60 * 1000;
      setTimeout(() => {
        try {
          if (fsSync.existsSync(mp3Path)) {
            fsSync.unlinkSync(mp3Path);
            console.log(`[Manajemen Memori] Siklus hidup berkas berakhir, pemusnahan berhasil dieksekusi: ${filename}`);
          }
        } catch (unlinkErr) {
          console.error("[Manajemen Memori] Anomali pada eksekusi penghapusan tertunda:", unlinkErr.message);
        }
      }, DESTRUCTION_DELAY);

      mp3Info = {
        download_url: `${BASE_URL}api/download/${filename}`,
        filename,
      };
    } catch (downloadErr) {
      console.error("[Transkoding] Interupsi pada utilitas pihak ketiga:", downloadErr.message);
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
      error: error?.message ?? "Terjadi malfungsi komputasi pada arsitektur utama peladen",
    });
  }
};

// ─── Pendaftaran Rute dan Pengikatan Porta ───────────────────────
app.get("/api/play", playController);
app.get("/api/download/:filename", downloadController);

app.listen(PORT, () => {
  console.log(`[Infrastruktur] Peladen web telah mengikat koneksi dan beroperasi secara penuh pada porta ${PORT}`);
});
