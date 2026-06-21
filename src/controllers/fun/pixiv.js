import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const buildCookie = (cookies) =>
  Object.entries(cookies)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

const COOKIE = buildCookie({
  PHPSESSID: process.env.PHPSESSID,
  yuid_b: process.env.YUID,
  device_token: process.env.TOKEN,
});

const client = axios.create({
  baseURL: "https://www.pixiv.net",
  timeout: 30000,
  headers: {
    Cookie: COOKIE,
    Referer: "https://www.pixiv.net/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    Accept: "application/json",
  },
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchImage = async (url) => {
  return axios({
    method: "GET",
    url,
    responseType: "stream",
    timeout: 30000,
    headers: {
      Referer: "https://www.pixiv.net/",
      Cookie: COOKIE,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
    validateStatus: () => true,
  });
};

export const searchPixiv = async (req, res) => {
  try {
    const {
      query = "anime",
      page = 1,
      order = "date_d",
      mode = "all",
    } = req.query;

    const { data } = await client.get(
      `/ajax/search/artworks/${encodeURIComponent(query)}`,
      {
        params: {
          word: query,
          order,
          mode,
          p: page,
          s_mode: "s_tag",
        },
      },
    );

    const items = data?.body?.illustManga?.data || [];

    const results = items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.url,
      detail: `/pixiv/detail/${item.id}`,
      user: item.userName,
      user_id: item.userId,
    }));

    res.json({
      success: true,
      page,
      total: results.length,
      data: results,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const detailPixiv = async (req, res) => {
  try {
    const { id } = req.params;

    const [illust, pages] = await Promise.all([
      client.get(`/ajax/illust/${id}`),
      client.get(`/ajax/illust/${id}/pages`),
    ]);

    const body = illust.data.body;

    const images = pages.data.body.map((img, index) => ({
      page: index,
      original: img.urls.original,
      regular: img.urls.regular,
      small: img.urls.small,
      thumb: img.urls.thumb,
      proxy: `/pixiv/image?url=${encodeURIComponent(img.urls.original)}`,
    }));

    res.json({
      success: true,
      id: body.id,
      title: body.title,
      description: body.description,
      createDate: body.createDate,
      uploadDate: body.uploadDate,
      pageCount: body.pageCount,
      bookmarkCount: body.bookmarkCount,
      likeCount: body.likeCount,
      viewCount: body.viewCount,
      tags: body.tags.tags.map((v) => v.tag),
      user: {
        id: body.userId,
        name: body.userName,
      },
      images,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const proxyImage = async (req, res) => {
  try {
    let { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "url required",
      });
    }

    url = decodeURIComponent(url);

    const response = await fetchImage(url);

    console.log("PIXIV URL:", url);
    console.log("STATUS:", response.status);
    console.log("TYPE:", response.headers["content-type"]);

    if (response.status !== 200) {
      return res.status(response.status).json({
        success: false,
        error: `Pixiv returned ${response.status}`,
      });
    }

    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "image/jpeg",
    );

    res.setHeader("Cache-Control", "public, max-age=86400");

    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const bulkDownload = async (req, res) => {
  try {
    const { query = "anime", limit = 10 } = req.body;

    const dir = path.join(__dirname, "downloads", query);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const { data } = await client.get(
      `/ajax/search/artworks/${encodeURIComponent(query)}`,
      {
        params: {
          word: query,
          order: "date_d",
          mode: "all",
          p: 1,
          s_mode: "s_tag",
        },
      },
    );

    const items = data?.body?.illustManga?.data || [];

    let success = 0;
    let failed = 0;

    for (let i = 0; i < Math.min(limit, items.length); i++) {
      try {
        const id = items[i].id;

        const pages = await client.get(`/ajax/illust/${id}/pages`);

        const imageUrl = pages.data.body?.[0]?.urls?.original;

        if (!imageUrl) {
          failed++;
          continue;
        }

        const image = await axios({
          method: "GET",
          url: imageUrl,
          responseType: "arraybuffer",
          headers: {
            Referer: "https://www.pixiv.net/",
            Cookie: COOKIE,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
          },
        });

        const ext = path.extname(imageUrl.split("?")[0]) || ".jpg";

        const file = path.join(dir, `${id}${ext}`);

        fs.writeFileSync(file, image.data);

        success++;

        console.log(`✓ ${id}`);

        await delay(1000);
      } catch {
        failed++;
      }
    }

    res.json({
      success: true,
      downloaded: success,
      failed,
      folder: dir,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
