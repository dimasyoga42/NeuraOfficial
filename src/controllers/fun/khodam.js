import { dbKhodamMegaCollection } from "../../db/khodam.js";
import { status } from "../../utility/statuscode.js";
import { struckRes } from "../../utility/struck";
import { struckError } from "../../utility/struckError.js";
export const khodam = (req, res) => {
  try {
    const key = Math.floor(Math.random() * dbKhodamMegaCollection.length);
    const data = dbKhodamMegaCollection[key];
    const message = {
      khodam: data.namaKhodam,
      alasan: data.alasan,
    };
    res.json(struckRes(status.berhasil, "khodam", message));
  } catch (err) {
    console.log(err);
  }
};
