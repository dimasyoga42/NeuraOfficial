import { waifu } from "../../db/image.js";
import { status } from "../../utility/statuscode.js";
import { struckImg } from "../../utility/struckImage.js";

export const waifuGhaca = (req, res) => {
  const key = Math.floor(Math.random() * waifu.length);
  const data = waifu[key];
  const response = struckImg(
    status.berhasil,
    data.NameImage,
    data.urlImage,
    data.source,
    data.art,
    data.length,
  );
  res.json(response);
};
