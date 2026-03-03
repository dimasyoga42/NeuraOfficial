import { waifu } from "../db/image.js";
import { struckImg } from "../utility/struckImage.js";

export const waifuGhaca = (req, res) => {
  const key = Math.floor(Math.random() * waifu.length);
  const data = waifu[key];
  const response = struckImg(
    200,
    data.NameImage,
    data.urlImage,
    data.source,
    data.art,
  );
  res.json(response);
};
