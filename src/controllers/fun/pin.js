import axios from "axios";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const pinterestSearch = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Parameter q wajib diisi",
      });
    }

    const COOKIES = {
      _auth: "1",
      csrftoken: process.env.CRS,
      _pinterest_sess: process.env.COOKIE,
    };

    const Client = axios.create({
      baseURL: "https://www.pinterest.com",
      timeout: 20000,
    });

    const buildCookieString = (cookieObj) =>
      Object.entries(cookieObj)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");

    const buildHeaders = (query = q) => ({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      Cookie: buildCookieString(COOKIES),
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRFToken": COOKIES.csrftoken,
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`,
      Origin: "https://www.pinterest.com",
      "x-pinterest-source-url": `/search/pins/?q=${encodeURIComponent(query)}`,
      "x-app-version": "c7c4c3d",
      "x-pinterest-pws-handler": "www/[username].js",
    });

    const { data } = await Client.get("/resource/BaseSearchResource/get/", {
      params: {
        source_url: `/search/pins/?q=${q}`,
        data: JSON.stringify({
          options: {
            query: q,
            scope: "pins",
            page_size: Number(limit),
          },
          context: {},
        }),
      },
      headers: buildHeaders(q),
    });

    const results = data?.resource_response?.data?.results || [];

    const pins = results
      .filter((pin) => pin?.images?.orig?.url)
      .slice(0, Number(limit))
      .map((pin) => ({
        id: pin.id,
        title: pin.title || "",
        description: pin.description || "",
        image: pin.images.orig.url,
        width: pin.images.orig.width,
        height: pin.images.orig.height,
        link: `https://www.pinterest.com/pin/${pin.id}/`,
      }));

    return res.status(200).json({
      success: true,
      keyword: q,
      total: pins.length,
      results: pins,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data Pinterest",
      error: err.message,
    });
  }
};
