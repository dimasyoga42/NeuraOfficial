import { status } from "../../utility/statuscode.js";
import { struckError } from "../../utility/struckError.js";

export const Anime = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      console.warn(
        `[ANIME] ⚠️  Query 'q' tidak terisi — ${new Date().toISOString()}`,
      );
      return res
        .status(status.bad)
        .json(
          struckError(status.bad, false, "Masukkan judul anime yang dicari."),
        );
    }

    res.json({ anime: q });
  } catch (err) {
    res.json(struckError(status.BadRequest, false, err.message));
  }
};
