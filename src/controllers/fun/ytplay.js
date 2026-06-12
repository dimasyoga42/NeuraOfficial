import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);
const fsPromises = fs.promises;

// ─── Konfigurasi Lingkungan Peladen ──────────────────────────────
const BASE_URL = process.env.BASE_URL ?? "https://neurapi.mochinime.cyou/";
const DOWNLOAD_DIR = path.resolve("public/downloads");
const YT_DLP_PATH = process.env.YT_DLP_PATH ?? "yt-dlp";

// Inisialisasi direktori penyimpanan media
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ─── Otomatisasi Pemeliharaan Direktori ──────────────────────────
const cleanOldDownloadsDirectory = async () => {
  const downloadDir = path.resolve("public/downloads");
  // Representasi 20 menit dalam komputasi milidetik
  const MAX_RETENTION_AGE = 20 * 60 * 1000;
  const currentTime = Date.now();

  try {
    const isAccessible = await fsPromises
      .access(downloadDir)
      .then(() => true)
      .catch(() => false);
    if (!isAccessible) return;

    const files = await fsPromises.readdir(downloadDir);
    if (files.length === 0) return;

    const deletionPromises = files.map(async (file) => {
      const filePath = path.join(downloadDir, file);
      const fileStats = await fsPromises.stat(filePath);

      // Evaluasi kelayakan penghapusan berdasarkan usia berkas
      if (
        fileStats.isFile() &&
        currentTime - fileStats.mtimeMs > MAX_RETENTION_AGE
      ) {
        await fsPromises.unlink(filePath);
        return file;
      }
      return null;
    });

    const results = await Promise.all(deletionPromises);
    const deletedFiles = results.filter((result) => result !== null);

    if (deletedFiles.length > 0) {
      console.log(
        `[Pemeliharaan] Total ${deletedFiles.length} berkas usang yang melewati batas retensi 20 menit berhasil dibersihkan.`,
      );
    }
  } catch (error) {
    console.error(
      "[Pemeliharaan] Terjadi anomali saat purifikasi direktori:",
      error.message,
    );
  }
};

// Menjadwalkan rutinitas pembersihan setiap 5 menit (300.000 milidetik)
setInterval(cleanOldDownloadsDirectory, 5 * 60 * 1000);

// ─── Pengendali Utama Pemrosesan Media ───────────────────────────
export const playController = async (req, res) => {
  try {
    const { query } = req.query ?? {};

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        error: "Parameter kueri wajib dideklarasikan",
      });
    }

    const keyword = query.trim();
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: "Parameter kueri tidak memenuhi standar validasi",
      });
    }

    // Eksekusi tahap pertama: Resolusi metadata menggunakan ytsearch1
    const searchArgs = ["--dump-json", "--no-playlist", `ytsearch1:${keyword}`];

    let videoData;
    try {
      const { stdout } = await execFileAsync(YT_DLP_PATH, searchArgs, {
        maxBuffer: 50 * 1024 * 1024,
      });
      videoData = JSON.parse(stdout.trim());
    } catch (searchErr) {
      console.error(
        "[Resolusi yt-dlp] Kegagalan analitik metadata:",
        searchErr.message,
      );
      return res.status(404).json({
        success: false,
        error: "Media yang dituju tidak teridentifikasi oleh sistem",
      });
    }

    // Pemetaan data leksikal untuk respons antarmuka pemrograman aplikasi
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

    // Eksekusi tahap kedua: Pengunduhan biner dan transkoding media
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

      // Injeksi fail kuki opsional jika peladen tujuan menerapkan restriksi
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
        "[Transkoding yt-dlp] Interupsi pada utilitas pengunduhan:",
        downloadErr.message,
      );
    }

    // Transmisi respons akhir menuju klien
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
        "Terjadi malfungsi komputasi pada arsitektur utama peladen",
    });
  }
};
