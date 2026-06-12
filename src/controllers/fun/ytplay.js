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

const app = express();

// ─── Modul Generator Kuki Dinamis Berstandar Netscape ────────────
const generateTempCookieFile = async () => {
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

  let cookieContent = "# Netscape HTTP Cookie File\n";
  cookieContent += "# https://curl.haxx.se/docs/http-cookies.html\n";
  cookieContent += "# Berkas ini disintesis secara dinamis oleh peladen Neura\n\n";

  // Mengalkulasi tenggat waktu kedaluwarsa artifisial selama satu tahun ke depan menggunakan epoch Unix
  const expiryTimestamp = Math.floor(Date.now() / 1000) + 31536000;

  for (const [key, value] of Object.entries(cookieMap)) {
    if (typeof value === "string" && value.trim() !== "") {
      // Menyusun leksikal sesuai spesifikasi tujuh kolom tabulasi absolut
      cookieContent += `.youtube.com\tTRUE\t/\tTRUE\t${expiryTimestamp}\t${key}\t${value}\n`;
    }
  }

  // Validasi mitigasi kegagalan apabila seluruh variabel lingkungan tidak terdefinisi
  if (cookieContent.split("\n").length <= 4) {
    return null;
  }

  const tempCookiePath = path.join(TMP_DIR, `neura_auth_${randomUUID()}.txt`);
  await fs.writeFile(tempCookiePath, cookieContent, "utf8");
  
  return tempCookiePath;
};

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

cleanOldDownloadsDirectory();

// ─── Pengendali Pengunduhan Dinamis ──────────────────────────────
export const downloadController = (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(TMP_DIR, safeFilename);

  if (!fsSync.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: "Berkas digital tidak ditemukan atau telah musnah setelah melewati masa retensi" });
  }

  res.download(filePath, safeFilename, (err) => {
    if (err && !res.headersSent) {
      console.error("[Transmisi] Terjadi interupsi jaringan selama distribusi biner:", err.message);
    }
  });
};

// ─── Pengendali Utama Pemrosesan Media ───────────────────────────
export const playController = async (req, res) => {
  let temporaryCookiePath = null;

  try {
    const { query } = req.query ?? {};

    if (!query || typeof query !== "string") {
      return res.status(400).json({ success: false, error: "Parameter kueri wajib dideklarasikan" });
    }

    const keyword = query.trim();
    if (!keyword) {
      return res.status(400).json({ success: false, error: "Parameter kueri tidak memenuhi standar validasi" });
    }

    // Menginisialisasi pembuatan berkas otentikasi fisik sebelum memanggil utilitas baris perintah
    temporaryCookiePath = await generateTempCookieFile();

    const searchArgs = [
      "--dump-json",
      "--no-playlist",
      "--js-runtimes", "nodejs"
    ];

    if (temporaryCookiePath) {
      searchArgs.push("--cookies", temporaryCookiePath);
    }

    searchArgs.push(`ytsearch1:${keyword}`);

    let videoData;
    try {
      const { stdout } = await execFileAsync(YT_DLP_PATH, searchArgs, { maxBuffer: 50 * 1024 * 1024 });
      videoData = JSON.parse(stdout.trim());
    } catch (searchErr) {
      console.error("[Resolusi] Kegagalan analitik metadata:", searchErr.message);
      return res.status(404).json({ success: false, error: "Sesi ditolak oleh peladen penyedia layanan akibat validasi kredensial yang gagal" });
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
        "--js-runtimes", "nodejs",
        "--output", mp3Path,
        "--no-playlist"
      ];

      if (temporaryCookiePath) {
        downloadArgs.push("--cookies", temporaryCookiePath);
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
            console.log(`[Manajemen Memori] Tenggat retensi tercapai, pemusnahan berkas biner berhasil dieksekusi: ${filename}`);
          }
        } catch (unlinkErr) {
          console.error("[Manajemen Memori] Anomali pada interupsi penghapusan media tertunda:", unlinkErr.message);
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
  } finally {
    // Prosedur pemusnahan berkas kredensial temporer secara absolut tanpa mempedulikan status keberhasilan komputasi
    if (temporaryCookiePath) {
      try {
        await fs.unlink(temporaryCookiePath);
        console.log(`[Keamanan Sistem] Berkas otentikasi temporer berhasil dimusnahkan dari memori sekunder.`);
      } catch (cleanupErr) {
        console.error("[Keamanan Sistem] Terjadi kegagalan saat mengeksekusi pemusnahan berkas otentikasi:", cleanupErr.message);
      }
    }
  }
};

