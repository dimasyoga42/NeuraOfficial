import { status } from "../../utility/statuscode.js";
import { struckImg } from "../../utility/struckImage.js";

export const dye = (req, res) => {
  res.json(
    struckImg(
      status.berhasil,
      "Dye Findder",
      "https://raw.githubusercontent.com/dimasyoga42/dataset/main/dye_weapon.png",
      "https://tanaka0.work/AIO/en/DyePredictor/ColorWeapon",
      "Tanaka",
    ),
  );
};
