import { supabase } from "../../../lib/db.js";
import { status } from "../../utility/statuscode.js";
import { struckRes } from "../../utility/struck.js";
import { struckError } from "../../utility/struckError.js";

export const searchItem = async (req, res) => {
  try {
    const { name, limit } = req.query;
    if (!name || !limit) {
      const nonvalid = struckError(status.bad, "Masukkan name dan limit", "-");
      return res.status(status.bad).json(nonvalid);
    }

    const { data, error } = await supabase
      .from("item")
      .select("*")
      .ilike("nama", `%${name}%`)
      .limit(parseInt(limit, 10));

    if (error) {
      return res
        .status(status.bad)
        .json(struckError(status.bad, "Database error", error.message));
    }

    if (!data || data.length === 0) {
      return res
        .status(status.notFound)
        .json(
          struckError(
            status.notFound,
            "Item search",
            "Item yang dicari tidak ditemukan",
          ),
        );
    }

    const result = struckRes(status.berhasil, "Item ditemukan", data);
    res.status(status.berhasil).json(result);
  } catch (err) {
    const errorResponse = struckError(
      status.BadRequest,
      "Request error",
      err.message,
    );
    res.status(status.BadRequest).json(errorResponse);
  }
};
