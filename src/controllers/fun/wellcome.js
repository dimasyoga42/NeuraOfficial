import { status } from "../../utility/statuscode.js";
import { struckError } from "../../utility/struckError.js";
import { createCanvas, loadImage } from "canvas";

const wellcome = async (req, res) => {
  try {
    const { phone, name, image, group } = req.query;
    if (!phone || !name || !image) {
      return res.json(
        struckError(
          status.Forbidden,
          "invalid message",
          "masukan phone name and image",
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
    // Posisi disesuaikan agar pas di bingkai ungu sebelah kiri
    const boxX = 110;
    const boxY = 320;
    const boxW = 340;
    const boxH = 480;
    ctx.drawImage(avatar, boxX, boxY, boxW, boxH);

    // ── 2. NAMA GRUP (TENGAH - DI BAWAH WELLCOME) ──
    // Menutup placeholder "Welcome Group" bawaan background
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 90px Sans";
    // Nama Grup diletakkan di tengah sesuai foto referensi
    ctx.fillText(name, 1240, 485);

    // ── 3. FOOTER (BAR HITAM - HANYA PHONE & NAME) ──

    // Nomor Telepon (Kiri Bawah di Bar Hitam)
    ctx.textAlign = "left";
    ctx.font = "bold 60px Sans";
    ctx.fillStyle = "#ffffff";
    // Diturunkan ke Y: 950 agar berada di dalam area hitam
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
