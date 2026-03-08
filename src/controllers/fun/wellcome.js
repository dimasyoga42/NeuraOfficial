import { status } from "../../utility/statuscode.js";
import { struckError } from "../../utility/struckError.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import axios from "axios";
import fs from "fs";
import path from "path";

// ── KONFIGURASI FONT GOOGLE ──
// Mendownload dan mendaftarkan font agar tidak muncul kotak-kotak di server
const fontPath = path.resolve("./Inter-Bold.ttf");
const setupFont = async () => {
  try {
    if (!fs.existsSync(fontPath)) {
      const fontUrl =
        "https://github.com/google/fonts/raw/main/ofl/inter/static/Inter-Bold.ttf";
      const response = await axios.get(fontUrl, {
        responseType: "arraybuffer",
      });
      fs.writeFileSync(fontPath, Buffer.from(response.data));
    }
    registerFont(fontPath, { family: "InterCustom" });
  } catch (err) {
    console.error("Gagal memuat font Google:", err.message);
  }
};

// Jalankan setup font saat inisialisasi file
setupFont();

const wellcome = async (req, res) => {
  try {
    // group: Teks tengah (bawah Wellcome)
    // name: Teks kanan bawah (bar hitam)
    // phone: Teks kiri bawah (bar hitam)
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

    // Memuat Asset Background
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
    ctx.font = "bold 90px InterCustom";
    ctx.fillText(name, 1240, 480);

    // ── 3. FOOTER (BAR HITAM) ──
    ctx.fillStyle = "#ffffff";

    // Nomor Telepon (Kiri Bawah)
    ctx.textAlign = "left";
    ctx.font = "bold 60px InterCustom";
    ctx.fillText(phone, 780, 955);

    // Nama Pengguna (Kanan Bawah - Tanpa Background)
    ctx.textAlign = "right";
    ctx.font = "bold 55px InterCustom";
    ctx.fillText(name, 1920, 955);

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
