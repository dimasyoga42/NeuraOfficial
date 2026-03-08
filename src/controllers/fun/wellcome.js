import { status } from "../../utility/statuscode.js";
import { struckError } from "../../utility/struckError.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import axios from "axios";
import fs from "fs";
import path from "path";

// ── KONFIGURASI FONT GOOGLE ──
const fontPath = path.resolve("./Inter_28pt-Bold.ttf");

const setupFont = async () => {
  try {
    // Cek dulu apakah font sudah ada, biar tidak download ulang tiap restart
    if (fs.existsSync(fontPath)) {
      registerFont(fontPath, { family: "Inter" });
      console.log("Font dimuat dari cache lokal.");
      return;
    }

    // ✅ FIX: Tambahkan axios.get() yang hilang + responseType arraybuffer
    const response = await axios.get(
      "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf",
      { responseType: "arraybuffer" },
    );

    fs.writeFileSync(fontPath, Buffer.from(response.data));
    registerFont(fontPath, { family: "Inter" });
    console.log("Font berhasil didownload dan didaftarkan.");
  } catch (err) {
    console.error("Gagal memuat font Google:", err.message);
    // Fallback: lanjut tanpa custom font (pakai font default canvas)
  }
};

// Jalankan setup font saat inisialisasi file
await setupFont();

const wellcome = async (req, res) => {
  try {
    // phone : Teks kiri bawah (bar hitam)
    // name  : Teks tengah (bawah Wellcome)
    // image : URL foto profil / avatar
    const { phone, name, image } = req.query;

    if (!phone || !name || !image) {
      return res.json(
        struckError(
          status.Forbidden,
          "invalid message",
          "masukan phone, name, and image",
        ),
      );
    }

    const width = 2048;
    const height = 1024;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // ── LOAD BACKGROUND ──
    const background = await loadImage(
      "https://i.ibb.co.com/4wNr50Sp/Wellcome.png",
    );
    ctx.drawImage(background, 0, 0, width, height);

    // ── 1. AVATAR ──
    const avatar = await loadImage(image);
    // Posisi avatar pada bingkai ungu kiri
    ctx.drawImage(avatar, 110, 320, 340, 480);

    // ── 2. NAMA GRUP (TENGAH) ──
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 90px Inter";
    ctx.fillText(name, 1240, 480);

    // ── 3. FOOTER (BAR HITAM) ──
    ctx.fillStyle = "#ffffff";
    // Nomor Telepon (Kiri Bawah)
    ctx.textAlign = "left";
    ctx.font = "bold 60px Inter";
    ctx.fillText(phone, 780, 955);

    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    return res.json(
      struckError(status.BadRequest, "internal server error", err.message),
    );
  }
};

export { wellcome };
