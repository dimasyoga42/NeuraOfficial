import { supabase } from "../../../lib/db.js";
import { status } from "../../utility/statuscode.js";
import { struckRes } from "../../utility/struck.js";
import { struckError } from "../../utility/struckError.js";

export const searchAbility = async (req, res) => {
  try {
    const { name, limit } = req.params;
    if (!name) {
      const nonvalid = struckError(status.bad, "Masukan nama ability", "-");
      return res.status(status.bad).json(nonvalid);
    }

    const { data, error } = await supabase
      .from("ability")
      .select("*")
      .ilike("name", `%${name}%`);

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
            "ability search",
            "ability yang dicari tidak ditemukan",
          ),
        );
    }

    const result = struckRes(status.berhasil, "ability ditemukan", data);
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
