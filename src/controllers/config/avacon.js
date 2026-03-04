import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { struckRes } from "../../utility/struck.js";
import { status } from "../../utility/statuscode.js";
import { struckError } from "../../utility/struckError.js";
export const Banner = async (req, res) => {
  try {
    const BASE_URL = "https://id.toram.jp";
    const LIST_URL = `${BASE_URL}/?type_code=all#contentArea`;

    const fixUrl = (url) => {
      if (!url) return null;
      if (url.startsWith("http")) return url;
      return BASE_URL + url;
    };

    const parseDate = (str) => {
      const m = str?.match(/(\d{4})-(\d{2})-(\d{2})/);
      return m ? new Date(m[1], m[2] - 1, m[3]) : null;
    };

    // =============================
    // FETCH LIST NEWS
    // =============================
    const response = await fetch(LIST_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    const newsList = [];

    $(".common_list li a").each((_, el) => {
      const href = $(el).attr("href");
      const dateStr = $(el).find(".time time").text().trim();

      if (!href || !dateStr) return;

      const dateObj = parseDate(dateStr);
      if (!dateObj) return;

      newsList.push({
        url: fixUrl(href),
        dateStr,
        dateObj,
      });
    });

    if (newsList.length === 0) {
      return res.status(404).json({ message: "Tidak ada berita." });
    }

    // =============================
    // SCAN SEMUA BERITA → PILIH TERBARU
    // =============================
    let newestDate = null;
    let newestBanners = [];

    for (const news of newsList) {
      const detailRes = await fetch(news.url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!detailRes.ok) continue;

      const detailHtml = await detailRes.text();
      const $detail = cheerio.load(detailHtml);

      const banners = [];

      $detail("h2.deluxetitle").each((_, h2) => {
        const title = $detail(h2).text().trim();

        const img = $detail(h2).nextAll("center").first().find("img");

        const src = img.attr("src") || img.attr("data-src");

        if (src && /toram_avatar_/i.test(src)) {
          banners.push({
            title,
            image: fixUrl(src),
          });
        }
      });

      if (banners.length === 0) continue;

      if (!newestDate || news.dateObj > newestDate) {
        newestDate = news.dateObj;
        newestBanners = banners.map((b) => ({
          ...b,
          dateStr: news.dateStr,
        }));
      }
    }

    if (newestBanners.length === 0) {
      return res
        .status(404)
        .json(struckError(status.bad, "ava", "tidak ada ava"));
    }

    // =============================
    // KIRIM BANNER TERBARU
    // =============================
    const dataBanners = newestBanners.map((banner) => ({
      name: banner.title,
      image: banner.image,
      date: banner.dateStr,
    }));

    return res
      .status(200)
      .json(struckRes(status.berhasil, "ava Banner", dataBanners));
  } catch (err) {
    return res
      .status(500)
      .json(struckError(status.BadRequest, "error message", err.message));
  }
};
