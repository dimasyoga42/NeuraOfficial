// controllers/waifuController.js
import axios from "axios";
const animeGirlCharacters = [
  "Asuna Yuuki",
  "Mikasa Ackerman",
  "Hinata Hyuga",
  "Rem",
  "Zero Two",
  "Nezuko Kamado",
  "Nico Robin",
  "Misaka Mikoto",
  "Emilia",
  "Tohka Yatogami",
  "Saber",
  "Rin Tohsaka",
  "Ryuuko Matoi",
  "Violet Evergarden",
  "Raphtalia",
  // tambah karakter lain sesuai kebutuhan
];

export const getRandomWaifu = async (req, res) => {
  try {
    // Pick karakter random
    const randomChar =
      animeGirlCharacters[
        Math.floor(Math.random() * animeGirlCharacters.length)
      ];

    // Fetch dari API
    const response = await axios.get(
      "https://neurapi.mochinime.cyou/api/etc/pin",
      {
        params: { q: randomChar },
      },
    );

    const results = response.data?.results;

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Tidak ada gambar ditemukan untuk karakter: ${randomChar}`,
      });
    }

    // Pick 1 gambar random dari hasil
    const randomImage = results[Math.floor(Math.random() * results.length)];

    return res.json({
      success: true,
      character: randomChar,
      image: randomImage.image,
      link: randomImage.link,
      width: randomImage.width,
      height: randomImage.height,
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
