import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

// ─── Konfigurasi Lingkungan Peladen ──────────────────────────────
const BASE_URL = process.env.BASE_URL ?? "https://neurapi.mochinime.cyou/";
const DOWNLOAD_DIR = path.resolve("public/downloads");
// Pastikan parameter ini mengarah pada lokasi biner yt-dlp yang valid di sistem operasi Anda
const YT_DLP_PATH = process.env.YT_DLP_PATH ?? "yt-dlp";

// Inisialisasi direktori penyimpanan media
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ─── Pengendali Utama Pemrosesan Media ───────────────────────────
export const playController = async (req, res) => {
  try {
    const { query } = req.query ?? {};

    if (!query || typeof query !== "string") {
      return res
        .status(400)
        .json({
          success: false,
          error: "Parameter kueri wajib dideklarasikan",
        });
    }

    const keyword = query.trim();
    if (!keyword) {
      return res
        .status(400)
        .json({
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
      return res
        .status(404)
        .json({
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

      // Injeksi fail kuki opsional jika peladen tujuan menerapkan restriksi usia pada konten spesifik
      if (process.env.YT_COOKIES_FILE) {
        downloadArgs.push("--cookies", process.env.YT_COOKIES_FILE);
      }

      await execFileAsync(YT_DLP_PATH, downloadArgs, {
        timeout: 300000,
        maxBuffer: 50 * 1024 * 1024,
      });

      // Penerapan penundaan siklus hidup fail selama 20 menit guna menjaga stabilitas memori sekunder
      const DESTRUCTION_DELAY = 20 * 60 * 1000;
      setTimeout(() => {
        try {
          if (fs.existsSync(mp3Path)) {
            fs.unlinkSync(mp3Path);
            console.log(
              `[Manajemen Memori] Tenggat retensi tercapai, pemusnahan berkas berhasil dieksekusi: ${filename}`,
            );
          }
        } catch (unlinkErr) {
          console.error(
            "[Manajemen Memori] Anomali pada interupsi penghapusan tertunda:",
            unlinkErr.message,
          );
        }
      }, DESTRUCTION_DELAY);

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
