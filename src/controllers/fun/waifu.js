// controllers/waifuController.js
import axios from "axios";
const animeGirlCharacters = [
  // ... (daftar karakter tetap sama, tidak diubah)
];

const BLOCKED_PATTERNS = [
  /\bchild\b/i,
  /\bkids?\b/i,
  /\bloli\b/i,
  /\bshota\b/i,
  /\b(\d{1,2})\s?(yo|tahun|year[s]?[- ]?old|살|세|歳)\b/i,
  /elementary/i,
  /grade ?school/i,
  /murid sd/i,
  /anak sd/i,
  /小学生/i, // murid sekolah dasar
  /초등학생/i, // murid sekolah dasar (KR)
];

function containsBlockedContent(text = "") {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

function toFullResImage(url) {
  if (!url) return url;
  return url.replace(/\/c\/\d+x\d+_\d+_[a-zA-Z0-9]+\//, "/");
}

export const getRandomWaifu = async (req, res) => {
  const MAX_ATTEMPTS = 100;

  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const randomChar =
        animeGirlCharacters[
          Math.floor(Math.random() * animeGirlCharacters.length)
        ];

      const response = await axios.get(
        `https://neurapi.mochinime.cyou/api/etc/pixiv/search?query=AnimeGril&page=${Math.floor(Math.random() * 60) + 1}`,
      );

      const results = response.data?.data;
      if (!results || results.length === 0) continue; // coba lagi

      // Saring hasil yang title-nya bermasalah
      const safeResults = results.filter(
        (item) => !containsBlockedContent(item.title),
      );
      if (safeResults.length === 0) continue; // semua hasil ditolak, coba lagi

      const randomImage =
        safeResults[Math.floor(Math.random() * safeResults.length)];

      return res.json({
        success: true,
        image: `https://neurapi.mochinime.cyou/api/etc/pixiv/image?url=${encodeURIComponent(toFullResImage(randomImage.thumbnail))}`,
        link: `https://pixiv.net${randomImage.detail}`,
        title: randomImage.title,
        user: randomImage.user,
        user_id: randomImage.user_id,
      });
    }

    // Kalau semua percobaan gagal dapat hasil yang aman
    return res.status(404).json({
      success: false,
      message:
        "Tidak ada hasil yang sesuai ditemukan setelah beberapa percobaan.",
    });
  } catch (error) {
    console.error("Error fetching waifu:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data dari API",
      error: error.message,
    });
  }
};
