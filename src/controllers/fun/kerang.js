import { status } from "../../utility/statuscode.js";
import { struckRes } from "../../utility/struck.js";
import { struckError } from "../../utility/struckError.js";

export const kerangAjaib = (req, res) => {
  try {
    const { q } = req.params;
    if (!q)
      return res.json(
        struckError(status.bad, "data invalid", "masukan pertanyaan"),
      );
    const dataKerang = [
      "ya",
      "tidak",
      "kemungkinan besar",
      "bisa jadi",
      "tidak mungkin",
      "tidak akan",
      "mungkin",
    ];
    const key = Math.floor(Math.random() * dataKerang.length);
    const value = {
      Q: q,
      Answer: dataKerang[key],
    };
    res.json(struckRes(status.berhasil, "Kerang Ajaib", value));
  } catch (err) {
    res.json(
      struckError(status.BadRequest, "server internal error", err.message),
    );
  }
};
